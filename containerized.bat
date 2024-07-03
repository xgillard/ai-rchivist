@echo off
:: The purpose of this script is to run the containerized version of the airchivist from my own machine
:: When deploying in production, please make sure to adapt this script according to your very infrastructure
:: (which is likely very different from my dev laptop !)
docker run --name    the-airchivist                                                                                                  ^
           --mount   "type=bind,src=C:\Users\xavier.gillard\Documents\REPO\ai-rchivist\data,dst=/opt/airchivist/data"                ^
           -e        "DATASET_DB=/opt/airchivist/data/dataset.db"                                                                    ^
           -e        "MISTRAL_API_KEY=ABCDEFGHIJKLMNOPQSRTUVWXYZ"                                                                    ^
           -e        "USE_LLM=false"                                                                                                 ^
           -p        8080:8080                                                                                                       ^
           -t        xaviergillard/airchivist:latest