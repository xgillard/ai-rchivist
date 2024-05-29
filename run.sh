#! /bin/sh

cd /opt/airchivist/
. /opt/airchivist/.venv/bin/activate
waitress-serve airchivist:app