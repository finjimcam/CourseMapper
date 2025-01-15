FROM python:3.10-alpine
WORKDIR /code

COPY . /code/

RUN pip install --upgrade -r /code/requirements.txt

CMD ["fastapi", "run", "main.py", "--port", "80"]