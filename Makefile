.PHONY: test api train dev
test:
	pytest ml/tests backend/tests -q
api:
	uvicorn app.main:app --reload --port 8000 --app-dir backend
train:
	python -m ml.src.train
dev:
	docker compose up --build
