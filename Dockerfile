# # The AIRchivist
#
# The airchivist is a prototype aiming to exploit an agentic LLM to perform data extraction in ancient texts whose transcription
# and understanding might be hard to grasp for present day people. In a second phase, this prototype should be recycled as a 
# tool to help archivist speedup their inventoriation process.
#
# ## Building the image
#
# Should you ever need to update the code of the airchivist (be it to adapt the LLM prompt), then you would likely need to rebuild
# the docker image before deploying it in your infrastructure. This dockerfile was used to create the xaviergillard/airchivist:latest 
# image. To create your own flavor of this container, you will need to adapt the following command according to your very needs.
# ```
# docker build -t xaviergillard/airchivist:latest .
# ```
# 
# ## Running the image
#
# ### On linux/OSX
# ```
# docker run --name    the-airchivist                                                                                                  \
#            --mount   "type=bind,src=$(pwd)\data,dst=/opt/airchivist/data"                                                            \
#            -e        "DATASET_DB=/opt/airchivist/data/dataset.db"                                                                    \
#            -e        "MISTRAL_API_KEY=ABCDEFGHIJKLMNOPQSRTUVWXYZ"                                                                    \
#            -e        "USE_LLM=false"                                                                                                 \
#            -p        8080:8080                                                                                                       \
#            -t        xaviergillard/airchivist:latest
# ```
#
# ### On Windows
# ```
# docker run --name    the-airchivist                                                                                                  ^
#            --mount   "type=bind,src=C:\Users\xavier.gillard\Documents\REPO\ai-rchivist\data,dst=/opt/airchivist/data"                ^
#            -e        "DATASET_DB=/opt/airchivist/data/dataset.db"                                                                    ^
#            -e        "MISTRAL_API_KEY=ABCDEFGHIJKLMNOPQSRTUVWXYZ"                                                                    ^
#            -e        "USE_LLM=false"                                                                                                 ^
#            -p        8080:8080                                                                                                       ^
#            -t        xaviergillard/airchivist:latest
# ```
#
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