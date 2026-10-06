FROM python:3.13-slim

WORKDIR /repo

COPY backend/requirements.txt /repo/backend/requirements.txt

RUN pip install --no-cache-dir -r /repo/backend/requirements.txt

COPY backend /repo/backend
COPY ml/schema /repo/ml/schema
COPY data/samples /repo/data/samples

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]