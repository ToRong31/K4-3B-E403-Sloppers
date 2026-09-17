# VLearn LabSpace Backend

Backend skeleton **FastAPI + LangGraph** cho AI đề xuất phân công task-owner. Cấu trúc tách `agent`, `api`, `core`, `models`, ba tầng test và golden-set eval để nhiều thành viên phát triển song song.

## Chạy local

Yêu cầu Python 3.11+.

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.api.main:app --reload
```

Mở `http://127.0.0.1:8000/docs` để thử API bằng Swagger UI.

## Kiểm tra

```bash
python -m pytest -q
python -m ruff check .
python -m eval.scripts.run_eval
```

## API hiện có

| Method | Path | Mục đích |
|---|---|---|
| GET | `/api/v1/health` | health check |
| POST | `/api/v1/assignments/draft` | chạy LangGraph, trả draft hoặc `clarify` |

Chi tiết ranh giới và ownership ở [docs/architecture/overview.md](docs/architecture/overview.md). Quyết định kiến trúc nằm trong [docs/adr](docs/adr).
