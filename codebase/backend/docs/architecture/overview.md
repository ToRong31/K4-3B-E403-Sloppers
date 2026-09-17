# Architecture overview

Backend là một modular monolith nhỏ, tách theo trách nhiệm để nhóm làm song song:

```text
Client → FastAPI route → LangGraph workflow → nodes → tools
                    ↘ Pydantic contracts ↗
```

- `src/agent`: workflow và quyết định AI. Không biết HTTP.
- `src/api`: transport, dependency injection. Không chứa business rule.
- `src/models`: contract duy nhất giữa API, graph và frontend.
- `src/core`: cấu hình/logging dùng chung, không chứa feature.
- `tests/unit`: node/tool thuần; `tests/integration`: HTTP; `tests/eval`: golden set.

## Ownership gợi ý

| Người | Vùng chính | Việc |
|---|---|---|
| Lâm Hải Dương | `src/agent`, `tests/eval`, `eval` | graph, prompt/tool, golden set |
| Hoàng Quốc Dũng | `src/api`, `tests/integration` | endpoint, validation, nối frontend |
| Phạm Hoàng Trọng | `src/core`, `docs/adr`, review contract | cấu hình, điều phối, review tích hợp |
| Lê Thị Thùy Trang | `eval/datasets`, acceptance criteria | chuyển evidence thành case kiểm thử |

Nếu đổi `src/models/schemas.py`, cần báo cả người làm API và agent vì đây là contract chung.

