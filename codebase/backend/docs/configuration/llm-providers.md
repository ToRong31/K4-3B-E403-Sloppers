# LLM provider configuration

Backend hỗ trợ ba provider qua cùng một factory:

| `LLM_PROVIDER` | Adapter | API key |
|---|---|---|
| `openai` | `ChatOpenAI` | `OPENAI_API_KEY` |
| `anthropic` | `ChatAnthropic` | `ANTHROPIC_API_KEY` |
| `gemini` | `ChatGoogleGenerativeAI` | `GOOGLE_API_KEY` |

`LLM_PROVIDER` là nguồn quyết định duy nhất. Factory không tự đoán provider từ key vì máy developer hoặc production có thể chứa nhiều key cùng lúc.

## OpenAI

```env
LLM_PROVIDER=openai
LLM_MODEL=your-openai-model
OPENAI_API_KEY=your-key
```

## Anthropic

```env
LLM_PROVIDER=anthropic
LLM_MODEL=your-anthropic-model
ANTHROPIC_API_KEY=your-key
```

## Gemini

```env
LLM_PROVIDER=gemini
LLM_MODEL=your-gemini-model
GOOGLE_API_KEY=your-key
```

Các tham số dùng chung:

```env
LLM_TEMPERATURE=0
LLM_TIMEOUT_SECONDS=60
LLM_MAX_RETRIES=2
```

Sau khi đổi `.env`, restart backend. `get_chat_model()` cache một model instance trong mỗi process; provider không được chọn không được khởi tạo và không bị yêu cầu API key.

Nếu thiếu `LLM_MODEL` hoặc key đúng với provider đã chọn, ứng dụng trả `LLMConfigurationError` rõ tên biến cần bổ sung. Không commit file `.env`.

