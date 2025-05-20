# This is the docker container image for the airchivist backend.
# 
# Essentially, this container provides the REST API written in python 
# (fastapi) that provide the core functionality: persistent data management
# and interactions with the LLM.
FROM python:3.10-alpine

# Make it sure we start in the appropriate workspace
WORKDIR /workspace

# Install the necessary dependencies in the container
RUN pip3 install --upgrade pip setuptools
RUN pip3 install poetry

# Install the application files in the container
COPY . /workspace/
RUN poetry install

# And serve them with fastapi for production setup. 
# Please note that this container exposes it services on port tcp:80, so
# make sure to remap that port to whatever you would like to expose. 
CMD [ "poetry", "run", "uvicorn", "--host", "0.0.0.0", "--port", "8080", "airchivist.backend:app"]