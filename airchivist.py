"""The airchivist is a tool to label a dataset from the pardons/sentences corpus.

It is a prototype meant to help with the training of a model that could be used
to perform the extraction in place of the LLMs.
"""

from __future__ import annotations

import json
import os
import sqlite3
import typing
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from flask import Flask, Response, redirect, render_template, request, url_for
from mistralai import ChatCompletionResponse, Mistral, UserMessage

from model import AppState, DocData, Message, Summary

##############################################################################
# SERVER INITIALIZATION
##############################################################################
load_dotenv()
DEFAULT_MODEL = "open-mistral-7b"

USE_LLM = str(os.getenv("USE_LLM")).lower() == "true"
API_KEY = str(os.getenv("MISTRAL_API_KEY"))
DATASET_DB = str(os.getenv("DATASET_DB"))

app = Flask(__name__)
client = Mistral(api_key=API_KEY)

##############################################################################
# DATA INIT
##############################################################################
def default_appstate(identifier: int = 0, text: str = "") -> AppState:
    """Return the default application state for the airchivist app."""
    return AppState(
        id = identifier,
        model = DEFAULT_MODEL,
        document= "",
        documentdata = DocData(
            document = text,
            doctype = "UNKNOWN",
            act_date = "UNKNOWN",
            fact_date = "UNKNOWN",
            summary = Summary(en = "", fr = "", nl = "", de = ""),
            persons = [],
            locations = [],
        ),
        conversation = [],
    )


def prepare_dataset() -> pd.DataFrame:
    """Return a dataframe comprising all the dataset data.

    The dataframe will have the following columns:
    - subset: (train, test, valid)
    - id: an identifier for this given specific document
    - validated: a boolean to tell whether or not the label has been
        validated by a human
    - labeling: the json data which comprises all the extracted info.
    - project: pardons, sentences
    - file_id: what file did this document originate from
    - text: the original text of the document.
    """
    with sqlite3.connect(DATASET_DB) as conn:
        return pd.read_sql("SELECT * FROM dataset", conn)


_ = prepare_dataset()


class Progress(typing.NamedTuple):
    """A plain data class to keep track of the labeling progress."""

    done: int
    all: int

    @property
    def percentile(self) -> float:
        """The total % of the target dataset that has been labeled."""
        return (self.done / self.all) * 100.0


def one_id_not_validated() -> int:
    """Return the id of an item that has not been marked as validated yet."""
    with sqlite3.connect(DATASET_DB) as conn:
        query_frame = pd.read_sql_query("SELECT id from dataset WHERE not validated ORDER BY RANDOM() LIMIT 1", conn)
        return int(query_frame.iloc[0, 0])


def progress() -> Progress:
    """Return the current progress."""
    with sqlite3.connect(DATASET_DB) as conn:
        query_frame = pd.read_sql_query(
            """
            WITH
                done AS (SELECT count(*) as done FROM dataset WHERE validated),
                full AS (SELECT count(*) as full  FROM dataset)
            SELECT done.done, full.full FROM done, full
            """,
            conn,
        )
    row = query_frame.iloc[0]
    return Progress(row.done, row.full)


##############################################################################
# ROUTES -- PAGES
##############################################################################
@app.route("/")
def empty() -> Response:
    """Redirect to route with_id and picks a random document.

    It redirects the user to a page where some random document has been chosen for annotation.
    """
    num = one_id_not_validated()
    return redirect(url_for("with_id", identifier=num))


@app.route("/<int:identifier>")
def with_id(identifier: int) -> str:
    """Return an html page based off a template for annotating the data.

    Return an html page based off a template for annotating the data of
    the document identified by the provided identifier
    """
    with sqlite3.connect(DATASET_DB) as conn:
        ds = pd.read_sql_query("SELECT labeling, text FROM dataset WHERE id = ? LIMIT 1", conn, params=(identifier,))
    row = ds.iloc[0]
    app_state : AppState = (
        AppState.model_validate_json(row.labeling)
        if row.labeling
        else initial_interaction(DEFAULT_MODEL, identifier, row.text)
    )
    return render_template("index.html", app_state=app_state.model_dump(), progress=progress())


##############################################################################
# ROUTES -- APIS
##############################################################################
@app.route("/initiate", methods=["POST"])
def initiate() -> dict:
    """Initiate the interaction between the user and the document.

    (incl. whatever is required by the llm) and returns a json object
    that can be edited in the user interface.
    """
    app_state = request.json
    return initial_interaction(app_state.get("model", DEFAULT_MODEL), int(app_state.id), app_state.document)


@app.route("/save", methods=["POST"])
def save() -> dict:
    """Tell the system that the user wants to save whatever work he/she has been doing.

    Hence meaning that the data should be considered validated.
    """
    app_state: AppState = AppState.model_validate(request.json)
    labeling : str = app_state.model_dump_json()
    with sqlite3.connect(DATASET_DB) as conn:
        conn.execute(
            """
            UPDATE dataset
            SET labeling  = ?,
                validated = 1
            WHERE id = ?
        """,
            (labeling, app_state.id),
        )
    return app_state.model_dump()


@app.route("/chat", methods=["POST"])
def chat() -> AppState:
    """Encapsulate the interaction between the user and the LLM.

    This is for the case when the user desires to interact with the system using natual language.
    """
    app_state: AppState = request.json
    model: str = app_state.get("model", DEFAULT_MODEL)
    conversation: list[Message] = app_state.conversation
    response: Message = interact_with_llm(model, conversation)
    conversation.append(response)
    return app_state


##############################################################################
# SERVER LOGIC
##############################################################################
def initial_convers(document: str) -> list[Message]:
    """Create the initial interaction between the server and the LLM.

    It reads the prompt and creates a first batch of messages to start the conversation with the agent.
    """
    sysprompt: str = Path("prompt.txt", encoding="utf8").read_text()
    longprompt: str = f"{sysprompt}\n\n# Document\n{document}"
    return [
        Message(role = "user", content = longprompt),
    ]


def interact_with_llm(model: str, conversation: list[Message]) -> Message:
    """Send the conversation to the LLM endpoint unless the USE_LLM flag is False.

    When USE_LLM flag is False, then a mock response will be read from the 'response.json'
    file rather than performing a complete roundtrip to the LLM provider.
    """
    if not USE_LLM:
        content: str = Path("response.json", encoding="utf8").read_text()
        return Message(role = "assistant", content = content)
    # if interaction with llm is needed
    response : ChatCompletionResponse | None = client.chat.complete(
        model=model,
        response_format={"type": "json_object"},
        messages=[UserMessage(role = m.role, content = m.content) for m in conversation],
    )
    result: str = response.choices[0].message
    return Message(role = result.role, content = result.content)


def initial_interaction(model: str, identifier: int, document: str) -> AppState:
    """Create the prompt for the given document and send the conversation start to the LLM.

    Returns the json object corresponding to the LLM response.
    """
    convers = initial_convers(document)
    response = interact_with_llm(model, convers)
    # append response to initial conversation
    convers.append(response)
    docdata: DocData = DocData.model_validate_json(response.content)
    return AppState(
        id = identifier,
        document = document,
        documentdata = docdata,
        conversation = convers,
        )


##############################################################################
# UTILS
##############################################################################
@app.context_processor
def utility_processor() -> typing.Callabled[[str], str]:
    """Utity processor.

    This processor allows me to customize how the jinja template rendering engine
    should behave under some circumstances.
    """

    def keep_fmt(txt: str) -> str:
        """Force jinja to replace all whitespaces by 'blank' html entities in the page it generates."""
        return txt.replace(" ", "&nbsp;")

    return {"keep_fmt": keep_fmt}


##############################################################################
# MAIN
##############################################################################
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True, load_dotenv=True)  # noqa: S104, S201
