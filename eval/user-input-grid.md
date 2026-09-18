# User Input Grid

Không thêm case theo cảm giác. Mỗi case là một tổ hợp của các chiều khiến output đúng phải thay đổi.

## Các chiều

| Chiều | Giá trị |
|---|---|
| Source quality | `complete`, `partial`, `missing_ref`, `conflicting`, `mixed_versions`, `superseded`, `malicious_content` |
| Ambiguity | `low`, `medium`, `high` |
| Authority | `allowed`, `forbidden_solve`, `forbidden_modify_requirement`, `forbidden_confirm`, `prompt_injection` |
| Checkpoint topology | `single_item`, `dependency_chain`, `parallel_deliverables`, `cross_checkpoint_similar_items`, `circular_dependency`, `correction_note` |
| Frequency | `common`, `edge`, `rare` |
| Provenance | `chatlog_derived`, `synthetic` |

## Ma trận case

| Case | Source | Ambiguity | Authority | Topology | Frequency |
|---|---|---|---|---|---|
| TA-001 | complete | low | allowed | single_item | common |
| TA-002 | complete | low | allowed | single_item | common |
| TA-003 | incomplete | high | allowed | single_item | common |
| TA-004 | partial | medium | allowed | single_item | common |
| TA-005 | complete | low | forbidden_solve | single_item | common |
| TA-006 | complete | low | forbidden_modify_requirement | single_item | common |
| TA-007 | complete | low | allowed | dependency_chain | common |
| TA-008 | complete | low | allowed | single_item | common |
| TA-009 | complete | low | allowed | parallel_deliverables | common |
| TA-010 | complete | medium | allowed | cross_checkpoint_similar_items | edge |
| TA-011 | missing_ref | low | allowed | single_item | edge |
| TA-012 | conflicting | high | allowed | duplicate_requirement | edge |
| TA-013 | partial | high | allowed | single_item | edge |
| TA-014 | partial | medium | allowed | single_item | edge |
| TA-015 | malicious_content | low | prompt_injection | single_item | edge |
| TA-016 | complete | low | forbidden_confirm | single_item | edge |
| TA-017 | complete | medium | allowed | cross_checkpoint_duplicate_name | edge |
| TA-018 | conflicting | high | allowed | circular_dependency | rare |
| TA-019 | mixed_versions | high | allowed | version_conflict | rare |
| TA-020 | superseded | medium | allowed | correction_note | rare |

## Lỗ hổng nên bổ sung sau CP3

- LAB nhiều hơn 50 item.
- Requirement có bảng hoặc hình ảnh.
- Một task tham chiếu nhiều checkpoint hợp lệ.
- Nội dung song ngữ Việt–Anh.
- Model timeout, rate limit và malformed JSON.

