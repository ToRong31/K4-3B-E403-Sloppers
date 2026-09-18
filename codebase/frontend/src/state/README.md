# Frontend state boundary

Thư mục này dành cho state dùng chung giữa nhiều feature. State chỉ thuộc một feature phải nằm trong feature đó.

Quy tắc:

- Server/backend là source of truth.
- API mutation thành công rồi mới merge event real-time vào state.
- Mọi entity real-time phải theo dõi `version` để bỏ event cũ hoặc trùng.
- Không import `mockData.js` trực tiếp từ component; luôn đi qua API adapter.
- Khi reconnect, fetch snapshot rồi mới tiếp tục nhận event.

