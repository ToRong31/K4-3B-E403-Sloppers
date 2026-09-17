.PHONY: install dev test eval lint format

install:
	python -m pip install -r requirements.txt

dev:
	python -m uvicorn src.api.main:app --reload

test:
	python -m pytest -q

eval:
	python -m eval.scripts.run_eval

lint:
	python -m ruff check .

format:
	python -m ruff format .

