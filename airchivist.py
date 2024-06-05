import os
import json
import datasets
import pandas as pd
from threading import RLock
from io import StringIO
from flask import Flask, render_template, request, Response
from dotenv import load_dotenv
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage

from checkpointing import (
    checkpointed,
    critical,
    generational,
    latest_checkpoint,
)

##############################################################################
# SERVER INITIALIZATION
##############################################################################
load_dotenv()
DEFAULT_MODEL = 'open-mistral-7b'

app = Flask(__name__)
use_llm = str(os.getenv('USE_LLM')).lower() == 'true'
checkpt = str(os.getenv('CHECKPOINT_DIR'))
api_key = str(os.getenv('MISTRAL_API_KEY'))
client = MistralClient(api_key=api_key)


##############################################################################
# DATA INIT
##############################################################################
def default_appstate(id: int = 0, text: str = '') -> dict:
    return {
        'id': id,
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
    if previously_checkpointed := latest_checkpoint(checkpt):
        return pd.read_json(previously_checkpointed)
    else:
        ds = datasets.load_dataset('arch-be/brabant-xvii', name='doc_by_doc')
        #
        train = ds['train'].to_pandas()
        test = ds['test'].to_pandas()
        valid = ds['valid'].to_pandas()
        # insert additional 'subset' column
        train.insert(0, 'subset', ['train'] * len(train))
        test.insert(0, 'subset', ['test'] * len(test))
        valid.insert(0, 'subset', ['valid'] * len(valid))
        # combine all subsets into one big dataframe
        ds = pd.concat([train, test, valid], axis='index', ignore_index=True)
        # insert one additional column to hold the json state
        ds.insert(0, 'id', [i for i in range(len(ds))])
        ds.insert(4, 'validated', [False for _ in range(len(ds))])
        ds.insert(5, 'labeling', [None for _ in range(len(ds))])
        return ds


# ce reentrant lock (peut etre acquis pls fois par le meme thread permet de
# garantir l'acces correct au dataset (qui n'est pas thread safe)
DS_LOCK = RLock()
DATASET = prepare_dataset()


@critical(DS_LOCK)
def save_dataset(fname):
    DATASET.to_json(fname)


##############################################################################
# ROUTES -- PAGES
##############################################################################
@app.route('/')
def empty() -> str:
    with DS_LOCK:
        not_processed_yet = DATASET[DATASET['validated'] == False]
        not_processed_yet = not_processed_yet.sample(1)['id']
    return with_id(int(not_processed_yet.iloc[0]))


@app.route('/<int:id>')
def with_id(id: int) -> str:
    with DS_LOCK:
        row = DATASET.iloc[id]
        labeling, text = row[['labeling', 'text']]
    app_state = (
        json.loads(labeling)
        if labeling
        else initial_interaction(DEFAULT_MODEL, id, text)
    )
    return render_template('index.html', app_state=app_state)


##############################################################################
# ROUTES -- APIS
##############################################################################
@app.route('/initiate', methods=['POST'])
def initiate() -> dict:
    app_state = request.json
    return initial_interaction(
        app_state['model'], int(app_state['id']), app_state['document']
    )


@app.route('/save', methods=['POST'])
@generational(directory=checkpt)
@checkpointed(save_dataset, directory=checkpt)
def save() -> dict:
    app_state = request.json
    labeling = json.dumps(app_state)
    with DS_LOCK:
        DATASET.loc[int(app_state['id']), 'labeling'] = labeling
    return app_state


@app.route('/chat', methods=['POST'])
def chat() -> dict:
    app_state = request.json
    model = app_state['model']
    conversation = app_state['conversation']
    document = app_state['document_data']['document']
    response = interact_with_llm(model, conversation)
    conversation.append(response)
    app_state['conversation'] = conversation
    app_state['document_data'] = json.loads(response['content'])
    app_state['document_data']['document'] = document
    return app_state


@app.route('/dump')
def dump():
    out = StringIO()
    with DS_LOCK:
        DATASET.to_json(out, index=False)
    csv = out.getvalue()
    response = Response(csv, content_type='text/json')
    response.headers['Content-Disposition'] = 'attachment; filename=data.json'
    return response


##############################################################################
# SERVER LOGIC
##############################################################################
def initial_convers(document: str) -> list[dict]:
    with open('prompt.txt', encoding='utf8') as f:
        sysprompt = f.read()
        usrprompt = document
        return [
            {'role': 'system', 'content': sysprompt},
            {'role': 'user', 'content': usrprompt},
        ]


def interact_with_llm(model: str, conversation: list[dict]) -> dict:
    if not use_llm:
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


def initial_interaction(model: str, id: int, document: str) -> dict:
    convers = initial_convers(document)
    response = interact_with_llm(model, convers)
    # append response to initial conversation
    convers.append(response)
    docdata = json.loads(response['content'])
    docdata['document'] = document
    return {'id': id, 'document_data': docdata, 'conversation': convers}


##############################################################################
# UTILS
##############################################################################
@app.context_processor
def utility_processor():
    def keep_fmt(txt: str) -> str:
        return txt.replace(' ', '&nbsp;')

    return {'keep_fmt': keep_fmt}


##############################################################################
# MAIN
##############################################################################
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True, load_dotenv=True)
