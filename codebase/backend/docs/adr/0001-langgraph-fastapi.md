# ADR 0001: FastAPI + LangGraph modular skeleton

- Status: accepted
- Date: 2026-09-17

## Decision

Dùng FastAPI làm HTTP layer, LangGraph biểu diễn workflow assignment và Pydantic làm contract. Giữ một deployable duy nhất trong hackathon.

## Why

Ranh giới này cho phép API, agent và eval phát triển song song; graph có nhánh `CLARIFY` minh bạch; chưa phát sinh chi phí vận hành microservice.

## Consequences

Thay model/provider không làm đổi API. Mọi state mới của graph phải serializable và cập nhật golden set.

