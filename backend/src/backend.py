"""These are the backend api used to carry the airchivist "intelligence"."""

from __future__ import annotations

import os
from pathlib import Path
from sqlite3 import Cursor, connect

from ollama import Client
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from model import (
    AppState,
    ChatRequest,
    DocData,
    InitialRequest,
    InitialResponse,
    Message,
    Progression,
    RandomId,
)

##############################################################################
# LLM API INITIALIZATION
##############################################################################
MODELS = [
    "llama3.2",
    "mistral-nemo",
]
DEFAULT_MODEL = MODELS[0]

USE_LLM = str(os.getenv("USE_LLM")).lower() == "true"
DATABASE = str(os.getenv("DATABASE"))
LLM_URL = str(os.getenv("LLM_URL"))
CLIENT = Client(host=LLM_URL)

for model in MODELS:
    CLIENT.pull(model)

##############################################################################
# SERVER INITIALIZATION
##############################################################################
app = FastAPI()

origins = [
    "http://localhost",  # development react
    "http://www.arch.be",
    "http://arch.be",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/progression")
def get_progress() -> Progression:
    """Return the progression of the corpus labeling."""
    with connect(DATABASE) as db:
        curr: Cursor = db.cursor()
        curr.execute("""
            WITH
                done AS (SELECT count(*) as done FROM dataset WHERE validated),
                full AS (SELECT count(*) as full  FROM dataset)
            SELECT done.done, full.full FROM done, full
            """)
        (done, full) = curr.fetchone()
        progress: Progression = Progression(done=done, full=full)
        return progress


@app.get("/notvalidated")
def pick_any_not_validated() -> RandomId:
    """Return the identifier for any document that has not been validated yet."""
    with connect(DATABASE) as db:
        curr: Cursor = db.cursor()
        curr.execute("SELECT id FROM dataset WHERE validated = 0")
        (identifier,) = curr.fetchone()
        return RandomId(id=identifier)


@app.get("/document/{identifier}")
def get_by_id(identifier: int) -> AppState:
    """Return an application state (that is, document labeling) by its id."""
    with connect(DATABASE) as db:
        curr: Cursor = db.cursor()
        curr.execute("SELECT labeling FROM dataset WHERE id = ?", (identifier,))
        (labeling,) = curr.fetchone()
        try:
            return AppState.model_validate_json(labeling)
        except ValidationError as e:
            raise HTTPException(status_code=500, detail="impossible to parse app state") from e


@app.post("/save")
def save(app_state: AppState) -> None:
    """Save the new app state to database."""
    with connect(DATABASE) as db:
        curr: Cursor = db.cursor()
        curr.execute(
            """
            UPDATE dataset
            SET labeling  = ?,
                validated = 1
            WHERE id = ?
            """,
            (app_state.model_dump_json(), app_state.id),
        )


@app.post("/initiate")
def initiate(request: InitialRequest) -> InitialResponse:
    """Perform the first round of analysis with the LLM."""
    conversation: list[Message] = initial_conversation(request.document)
    model = request.model if request.model in MODELS else DEFAULT_MODEL
    response: Message = chat(ChatRequest(model=model, conversation=conversation))
    try:
        documentdata: DocData = DocData.model_validate_json(response.content)
    except ValidationError as e:
        raise HTTPException(status_code=500, detail="impossible to parse document data") from e
    conversation.append(response)
    return InitialResponse(documentdata=documentdata, conversation=conversation)


@app.post("/chat")
def chat(request: ChatRequest) -> Message:
    """Send the conversation to LLM."""
    response = CLIENT.chat(
        model = request.model if request.model in MODELS else DEFAULT_MODEL,
        messages=request.conversation,
        format = DocData.model_json_schema(),
    )

    if not response:
        raise HTTPException(status_code=503, detail="No answer from the llm")

    result = str(response.message.content)

    return Message(role="assistant", content=result)


def initial_conversation(document: str) -> list[Message]:
    """Build the initial conversation around a given text document."""
    prompt: str = Path("prompt.txt").read_text(encoding="utf8")

    return [Message(role="system", content=prompt), Message(role="user", content=document)]

