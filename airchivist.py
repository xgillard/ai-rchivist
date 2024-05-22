import os
import json
from flask                            import Flask, render_template, request
from dotenv                           import load_dotenv
from mistralai.client                 import MistralClient
from mistralai.models.chat_completion import ChatMessage

#########################################################################################################
# SERVER INITIALIZATION
#########################################################################################################
load_dotenv()

app     = Flask(__name__)
api_key = os.getenv("MISTRAL_API_KEY")
model   = os.getenv("MISTRAL_MODEL")
use_llm = os.getenv("USE_LLM").lower() == "true"
client  = MistralClient(api_key=api_key)

#########################################################################################################
# ROUTES -- PAGES
#########################################################################################################
@app.route("/")
def empty() -> str:
    return render_template('index.html', app_state=default_appstate())

@app.route("/<int:id>")
def with_id(id: int) -> str: 
    with open("document.txt") as f:
        document  = f.read()
        app_state = initial_interaction(document)
        return render_template('index.html', app_state=app_state)

#########################################################################################################
# ROUTES -- APIS
#########################################################################################################
@app.route("/initiate", methods=["POST"])
def initiate() -> dict:
    return initial_interaction(request.json["document"])

@app.route("/save", methods=["POST"])
def save() -> dict: 
    app_state = request.json
    print(f"{json.dumps(app_state['document_data'])}")
    return app_state

@app.route("/chat", methods=["POST"])
def chat() -> dict: 
    app_state    = request.json
    conversation = app_state["conversation"]
    document     = app_state["document_data"]["document"]
    response     = interact_with_llm(conversation)
    conversation.append(response)
    app_state["conversation"]              = conversation
    app_state["document_data"]             = json.loads(response["content"])
    app_state["document_data"]["document"] = document
    return app_state

#########################################################################################################
# SERVER LOGIC
#########################################################################################################
def initial_convers(document: str) -> list[dict]:
    with open("prompt.txt") as f:
        sysprompt = f.read()
        usrprompt = document
        return [
            {"role" : "system", "content" : sysprompt},
            {"role" : "user",   "content" : usrprompt} 
        ]

def interact_with_llm(conversation: list[dict]) -> dict:
    if not use_llm:
        with open("response.json") as f:
            return {
                "role"    : "assistant", 
                "content" : f.read()
            }
    else:
        messages = [ ChatMessage(role=msg["role"], content=msg["content"]) for msg in conversation]
        response = client.chat(
            model           = model,
            response_format = {"type": "json_object"},
            messages        = messages
        )
        result = response.choices[0].message
        return {
            "role"   : result.role,
            "content": result.content
        }

def initial_interaction(document: str) -> dict:
    convers = initial_convers(document)
    response= interact_with_llm(convers)
    # append response to initial conversation
    convers.append(response)
    # rebuild docdata from json response (#FIXME)
    docdata             = json.loads(response["content"])
    docdata["document"] = document
    return {
        "document_data": docdata,
        "conversation" : convers
    }


#########################################################################################################
# DATA INIT
#########################################################################################################
def default_appstate() -> dict:
    return {
        "document_data": {
            "document": "",
            "doctype"  : "UNKNOWN",
            "act_date" : "UNKNOWN",
            "fact_date": "UNKNOWN",
            "summary"  : {
                "en": "",
                "fr": "",
                "nl": "",
                "de": ""
            },
            "persons"  : [],
            "locations": []
        },
        "conversation" : []
    }


#########################################################################################################
# MAIN
#########################################################################################################
if __name__ == "__main__":
   app.run(host="0.0.0.0", port=8080)
