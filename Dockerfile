# This dockerfile is used to create the xaviergillard/airchivist:latest image
# docker build -t xaviergillard/airchivist:latest .
#
# It is then run as follow:
# docker run -p 8080:8080 -t xaviergillard/airchivist:latest
FROM ubuntu:24.04

RUN apt-get update
RUN apt-get install -y python3 python3-pip python3-venv

COPY run.sh                       /opt/airchivist/run.sh
COPY static                       /opt/airchivist/static/
COPY templates                    /opt/airchivist/templates/
COPY .env                         /opt/airchivist/.env
COPY airchivist.py                /opt/airchivist/airchivist.py
COPY checkpointing.py             /opt/airchivist/checkpointing.py
COPY requirements.txt             /opt/airchivist/requirements.txt
COPY prompt.txt                   /opt/airchivist/prompt.txt
# --- mock stuffs ------------------------------------------
COPY document.txt                 /opt/airchivist/document.txt
COPY response.json                /opt/airchivist/response.json
COPY response2.json               /opt/airchivist/response2.json
COPY response2.json               /opt/airchivist/response2.json
COPY medium-model-response.json   /opt/airchivist/medium-model-response.json
COPY medium-model-state.json      /opt/airchivist/medium-model-state.json
# --- end mock stuffs --------------------------------------

WORKDIR /opt/airchivist/
RUN python3 -m venv .venv
RUN . ./.venv/bin/activate           ; \
    pip3 install -r requirements.txt
RUN chmod +x run.sh 

ENTRYPOINT [ "/opt/airchivist/run.sh" ]