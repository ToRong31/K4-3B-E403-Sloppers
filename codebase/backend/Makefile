.PHONY: install dev test eval lint format smoke-llm docker-up docker-down docker-logs db-shell

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

smoke-llm:
	python -m src.infrastructure.llm.smoke_test

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f api db

db-shell:
	docker compose exec db psql -U vlearn -d vlearn_labspace

