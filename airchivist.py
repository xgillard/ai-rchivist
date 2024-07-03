'''
The airchivist is a tool to label a dataset from the pardons/sentences
corpus so as to train a model that could be used to perform the extraction
in place of the LLMs.
'''
from __future__ import annotations
import os
import json
from typing import NamedTuple
import sqlite3  # type: ignore

import datasets      # type: ignore
import pandas as pd  # type: ignore
from flask import Flask, render_template, request, Response, redirect, url_for
from dotenv import load_dotenv
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage


##############################################################################
# SERVER INITIALIZATION
##############################################################################
load_dotenv()
DEFAULT_MODEL = 'open-mistral-7b'

USE_LLM = str(os.getenv('USE_LLM')).lower() == 'true'
API_KEY = str(os.getenv('MISTRAL_API_KEY'))
DATASET_DB = str(os.getenv('DATASET_DB'))

app = Flask(__name__)
client = MistralClient(api_key=API_KEY)


##############################################################################
# DATA INIT
##############################################################################
def default_appstate(identifier: int = 0, text: str = '') -> dict:
    'Returns the default application state for the airchivist app'
    return {
        'id': identifier,
        'model': DEFAULT_MODEL,
        'document_data': {
            'document': text,
            'doctype': 'UNKNOWN',
            'act_date': 'UNKNOWN',
            'fact_date': 'UNKNOWN',
            'summary': {'en': '', 'fr': '', 'nl': '', 'de': ''},
            'persons': [],
            'locations': [],
        },
        'conversation': [],
    }


def prepare_dataset() -> pd.DataFrame:
    '''
    Returns a dataframe comprising all the dataset data.
    The dataframe will have the following columns:
    - subset: (train, test, valid)
    - id: an identifier for this given specific document
    - validated: a boolean to tell whether or not the label has been
        validated by a human
    - labeling: the json data which comprises all the extracted info.
    - project: pardons, sentences
    - file_id: what file did this document originate from
    - text: the original text of the document.
    '''
    with sqlite3.connect(DATASET_DB) as conn:
        try:
            return pd.read_sql('SELECT * FROM dataset', conn)
        except pd.errors.DatabaseError:
            # Initial computation is actually needed
            ds = datasets.load_dataset('arch-be/brabant-xvii', name='doc_by_doc')
            #
            train = ds['train'].to_pandas()
            test = ds['test'].to_pandas()
            valid = ds['valid'].to_pandas()
            # insert additional 'subset' column
            train['subset'] = 'train'
            test['subset'] = 'test'
            valid['subset'] = 'valid'
            # combine all subsets into one big dataframe
            ds = pd.concat([train, test, valid], axis='index', ignore_index=True)
            # append the utility columns (will be used to actually carry the labeling out)
            ds['validated'] = False
            ds['labeling'] = None
            # add some metadata to the index and columns for efficient hdf5 serialization
            ds.index.name = 'id'
            ds.subset = ds.subset.astype('category')
            ds.project = ds.project.astype('category')
            ds.file_id = ds.file_id.astype(str)
            ds.text = ds.text.astype(str)
            ds.to_sql('dataset', conn)
            return ds


_ = prepare_dataset()


class Progress(NamedTuple):
    'A plain data class to keep track of the labeling progress'
    done: int
    all: int

    @property
    def percentile(self):
        'The total % of the target dataset that has been labeled'
        return (self.done / self.all) * 100.0


def one_id_not_validated() -> int:
    '''
    returns the id of an item that has not been marked as validated yet
    '''
    with sqlite3.connect(DATASET_DB) as conn:
        df = pd.read_sql_query("SELECT id from dataset WHERE not validated ORDER BY RANDOM() LIMIT 1", conn)
        return int(df.iloc[0, 0])


def progress() -> Progress:
    'Returns the current progress'
    with sqlite3.connect(DATASET_DB) as conn:
        df = pd.read_sql_query("""
            WITH 
                done AS (SELECT count(*) as done FROM dataset WHERE validated),
                full AS (SELECT count(*) as full  FROM dataset)
            SELECT done.done, full.full FROM done, full
            """, conn)
    row = df.iloc[0]
    return Progress(row.done, row.full)


##############################################################################
# ROUTES -- PAGES
##############################################################################
@app.route('/')
def empty() -> Response:
    '''
    This is the default route. It redirects the user to a page
    where some random document has been chosen for annotation
    '''
    num = one_id_not_validated()
    return redirect(url_for('with_id', identifier=num))


@app.route('/<int:identifier>')
def with_id(identifier: int) -> str:
    '''
    This is the most useful route in the sense that this is the
    route that returns an html page based off a template for annotating
    the data of the document identified by the provided identifier
    '''
    with sqlite3.connect(DATASET_DB) as conn:
        ds = pd.read_sql_query("SELECT labeling, text FROM dataset WHERE id = ? LIMIT 1", conn, params=(identifier,))
    row = ds.iloc[0]
    app_state = (
        json.loads(row.labeling, strict=False)
        if row.labeling
        else initial_interaction(DEFAULT_MODEL, identifier, row.text)
    )
    return render_template(
        'index.html', app_state=app_state, progress=progress()
    )


##############################################################################
# ROUTES -- APIS
##############################################################################
@app.route('/initiate', methods=['POST'])
def initiate() -> dict:
    '''
    This route is that of an API accessible only over POST.

    It initiates the interaction between the user and the document
    (incl. whatever is required by the llm) and returns a json object
    that can be edited in the user interface.
    '''
    app_state = request.json
    return initial_interaction(
        app_state.get('model', DEFAULT_MODEL),
        int(app_state['id']),
        app_state['document']
    )


@app.route('/save', methods=['POST'])
def save() -> dict:
    '''
    This API tells the system that the user wants to save whatever work
    he/she has been doing with the system -- hence meaning that the data
    should be considered validated.
    '''
    app_state = request.json
    labeling = json.dumps(app_state)
    with sqlite3.connect(DATASET_DB) as conn:
        conn.execute('''
            UPDATE dataset
            SET labeling  = ?,
                validated = 1
            WHERE id = ?
        ''',
        (labeling, int(app_state['id'])))
    return app_state


@app.route('/chat', methods=['POST'])
def chat() -> dict:
    '''
    This API encapsulates the interaction between the user and the LLM
    for the case when the user desires to interact with the system using
    natual language.
    '''
    app_state = request.json
    model = app_state.get('model', DEFAULT_MODEL)
    conversation = app_state['conversation']
    document = app_state['document_data']['document']
    response = interact_with_llm(model, conversation)
    conversation.append(response)
    app_state['conversation'] = conversation
    app_state['document_data'] = json.loads(response['content'], strict=False)
    app_state['document_data']['document'] = document
    return app_state


##############################################################################
# SERVER LOGIC
##############################################################################
def initial_convers(document: str) -> list[dict]:
    '''
    This function creates the initial interaction between the server and the
    LLM. It reads the prompt and creates a first batch of messages to start
    the conversation with the agent.
    '''
    with open('prompt.txt', encoding='utf8') as f:
        sysprompt = f.read()
        usrprompt = document
        return [
            {'role': 'system', 'content': sysprompt},
            {'role': 'user', 'content': usrprompt},
        ]


def interact_with_llm(model: str, conversation: list[dict]) -> dict:
    '''
    This function actually sends the conversation to the LLM endpoint
    unless the USE_LLM flag is False. In that case a mock response will
    be read from the 'response.json' file rather than performing a
    complete roundtrip to the LLM provider.
    '''
    if not USE_LLM:
        with open('response.json', encoding='utf8') as f:
            return {'role': 'assistant', 'content': f.read()}
    else:
        messages = [
            ChatMessage(role=msg['role'], content=msg['content'])
            for msg in conversation
        ]
        response = client.chat(
            model=model,
            response_format={'type': 'json_object'},
            messages=messages,
        )
        result = response.choices[0].message
        return {'role': result.role, 'content': result.content}


def initial_interaction(model: str, identifier: int, document: str) -> dict:
    '''
    This method creates the prompt for the given document, and sends the
    conversation start to the LLM. After that, it returns the json object
    corresponding to the LLM response.
    '''
    convers = initial_convers(document)
    response = interact_with_llm(model, convers)
    # append response to initial conversation
    convers.append(response)
    docdata = json.loads(response['content'], strict=False)
    docdata['document'] = document
    return {
        'id': identifier,
        'document_data': docdata,
        'conversation': convers
    }


##############################################################################
# UTILS
##############################################################################
@app.context_processor
def utility_processor():
    '''
    This is an utity processor that allows me to customize how the jinja
    template rendering engine should behave under some circumstances.
    '''
    def keep_fmt(txt: str) -> str:
        '''
        This context processor forces jinja to replace all whitespaces by
        'blank' html entities in the page it generates
        '''
        return txt.replace(' ', '&nbsp;')

    return {'keep_fmt': keep_fmt}


##############################################################################
# MAIN
##############################################################################
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True, load_dotenv=True)
