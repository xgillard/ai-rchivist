# This is the docker container image for the semantic search (RAG) backend.
# 
# The definition of this contained is based on the `rag-base` image 
# (see ../rag-base) to keep this definition streamlined and cut build times.
#
# Essentially, this container provides the REST API written in python 
# (fastapi) that provide the core functionality of the semantic search engine:
# indexation, retrieval and and answer generation.

# build environment
FROM node:23-alpine3.20 AS build
RUN npm install -g create-vite@latest
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/ngnix.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]