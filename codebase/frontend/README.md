# VLearn LabSpace Frontend

Ứng dụng React thật của VLearn LabSpace. Mockup tham chiếu nằm ở `../vlearn-labspace/` và không được dùng làm production source.

Theo dõi mức độ hoàn thiện từng màn hình tại [`UI-CHECKLIST.md`](./UI-CHECKLIST.md).

## Chạy local

```bash
npm install
npm run dev
```

Mặc định frontend dùng mock adapter để cả nhóm phát triển UI trước backend:

```env
VITE_DATA_SOURCE=mock
```

Khi backend đã sẵn sàng, tạo `.env.local`:

```env
VITE_DATA_SOURCE=http
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_WS_URL=ws://127.0.0.1:8000/api/v1/realtime
```

## Kiểm tra

```bash
npm test
npm run build
```

## Ranh giới quan trọng

- UI phải bám mockup và mọi thay đổi visual do Lê Thị Thùy Trang review.
- Mock adapter phải luôn hiển thị nhãn `Dữ liệu mô phỏng`.
- Component chỉ gọi interface trong `src/api/`; không import mock data trực tiếp.
- `src/api/httpApiClient.js` và `src/realtime/webSocketClient.js` là điểm nối backend sau này.
