FROM python:3.9-alpine

RUN pip install pycodestyle

COPY main.sh /main.sh

ENTRYPOINT [ "/main.sh" ]
