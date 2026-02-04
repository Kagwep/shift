FROM python:3.9-bullseye
WORKDIR /app
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY src/ ./src/
ENTRYPOINT ["python3", "/app/src/app.py"]
