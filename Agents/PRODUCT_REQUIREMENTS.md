# TÀI LIỆU YÊU CẦU SẢN PHẨM (PRODUCT REQUIREMENTS DOCUMENT - PRD)

---

## 1. TỔNG QUAN SẢN PHẨM (PRODUCT OVERVIEW)

### 1.1. Tầm nhìn sản phẩm (Vision Statement)
Xây dựng một tựa game **Bomber cổ điển (Classic Bomberman)** chất lượng cao, chạy mượt mà ngay trên trình duyệt web mà không cần cài đặt plugin. Trò chơi kết hợp lối chơi chiến thuật đặt bom truyền thống với đồ họa pixel art hoài niệm, âm thanh sống động và hiệu năng 60 FPS ổn định.

### 1.2. Mục tiêu chiến lược
- Mang lại trải nghiệm giải trí tức thì, hoài niệm và hấp dẫn cho người dùng web.
- Xây dựng một chuẩn mực mẫu về kiến trúc game client-side bằng TypeScript và Phaser 3, sẵn sàng cho việc bảo trì, phát triển mở rộng và tiếp quản bởi các AI Coding Agents.

---

## 2. ĐỐI TƯỢNG NGƯỜI DÙNG & NỀN TẢNG MỤC TIÊU

### 2.1. Chân dung người dùng (Target Audience)
- Game thủ yêu thích thể loại Retro Arcade / Bomberman cổ điển.
- Người chơi văn phòng, học sinh, sinh viên tìm kiếm trò chơi giải trí nhanh trên trình duyệt web máy tính để bàn (Desktop).

### 2.2. Nền tảng mục tiêu (Target Platform)
- **Giai đoạn MVP**: Web Desktop (Hệ điều hành Windows, macOS, Linux).
- **Trình duyệt hỗ trợ**: Google Chrome, Mozilla Firefox, Microsoft Edge, Apple Safari phiên bản hiện hành.
- **Phương thức điều khiển chính**: Bàn phím máy tính (Phím mũi tên / WASD để di chuyển, Phím Space để đặt bom, Phím P để tạm dừng).
- **Giai đoạn tương lai (Post-MVP)**: Thiết bị di động (Mobile Web) với màn hình cảm ứng (Virtual Joystick & Action Buttons).

---

## 3. PHẠM VI DỰ ÁN (SCOPE SPECIFICATION)

### 3.1. Phạm vi MVP (In-Scope for MVP)
| Hạng mục | Chi tiết trong phạm vi MVP |
| :--- | :--- |
| **Bản đồ (Map)** | Lưới ma trận chuẩn 15 cột x 13 dòng (Grid 15x13). Bao gồm tường cứng không thể phá hủy (Hard Wall) và gạch mềm có thể phá hủy (Soft Brick). |
| **Nhân vật (Player)** | Điều khiển 1 nhân vật Bomber chính: Di chuyển 4 hướng mượt mà với cơ chế trượt góc (Corner Sliding), hoạt ảnh 4 hướng, đặt bom, phản hồi khi bị nổ hoặc chạm quái. |
| **Bom & Vụ nổ (Bomb & Blast)** | Đặt bom tại tâm ô lưới, đếm ngược nổ 3 giây, tia lửa nổ lan truyền 4 hướng chữ thập (+), phá hủy gạch mềm, kích hoạt nổ dây chuyền (chain reaction) các quả bom khác. |
| **Vật phẩm bổ trợ (Power-ups)** | 3 loại vật phẩm cơ bản ngẫu nhiên ẩn dưới gạch mềm: Thêm Bom (Bomb Up), Tăng Tầm Nổ (Fire Up), Tăng Tốc Độ (Speed Up). |
| **Quái vật & AI (Enemies)** | 2 loại quái cổ điển:<br>1. *Ballom*: Di chuyển chậm, chọn hướng ngẫu nhiên tại giao lộ, đổi hướng khi gặp vật cản.<br>2. *Oneal*: Tốc độ trung bình, có khả năng phát hiện người chơi khi cùng hàng/cột và đuổi theo. |
| **Cửa thoát hiểm (Exit Door)** | Cửa qua màn ẩn dưới một khối gạch mềm ngẫu nhiên; chỉ mở khi đã tiêu diệt hết toàn bộ quái vật trong màn chơi. |
| **Hệ thống màn chơi (Levels)** | 3 màn chơi (Stage 1, Stage 2, Stage 3) với độ khó tăng dần (số lượng gạch và quái vật tăng lên). |
| **Quy tắc Thắng / Thua** | - **Thắng màn**: Tiêu diệt hết quái vật và bước vào Cửa thoát hiểm mở.<br>- **Thua cuộc**: Hết mạng (bắt đầu với 3 mạng), bị quái vật chạm trúng, bị lửa bom thiêu rụi, hoặc hết thời gian màn chơi (200 giây/màn). |
| **Giao diện & HUD** | Hiển thị Số mạng còn lại (Lives), Điểm số hiện tại (Score), Thời gian đếm ngược (Time), Số lượng bom hiện có. Màn hình Start Menu, Pause Modal, Game Over và Victory. |
| **Lưu trữ dữ liệu** | Lưu điểm cao kỷ lục (High Score) vào `localStorage` của trình duyệt. |

### 3.2. Ngoài phạm vi MVP (Out-of-Scope / Post-MVP)
- Đấu mạng nhiều người (Multiplayer) qua WebSocket / WebRTC.
- Hệ thống tài khoản người dùng, đăng nhập và bảng xếp hạng trực tuyến trên máy chủ (Backend Leaderboard).
- Trình biên tập màn chơi tùy chỉnh (Custom Level Editor).
- Các vật phẩm nâng cao: Bom điều khiển từ xa (Remote Detonator), Đá bom (Bomb Kick), Đi xuyên bom / xuyên tường (Pass-through).
- Bàn phím ảo cảm ứng cho thiết bị di động (Mobile Virtual D-Pad).

---

## 4. DANH SÁCH USER STORIES & TIÊU CHÍ CHẤP NHẬN

### US-01: Di chuyển nhân vật
- **Là một**: Người chơi
- **Tôi muốn**: Sử dụng phím mũi tên hoặc WASD để di chuyển nhân vật quanh mê cung.
- **Để**: Tránh né quái vật và tiếp cận các vị trí thuận lợi để đặt bom.
- **Tiêu chí chấp nhận**:
  - Nhân vật phản hồi tức thì với thao tác nhấn phím, di chuyển mượt mà không bị khựng (giật lag).
  - Nhân vật không thể đi xuyên qua Tường cứng (Hard Wall) hoặc Gạch mềm (Soft Brick) hoặc Bom đã đặt.
  - Khi người chơi rẽ vào góc cua hẹp, hệ thống tự động hỗ trợ trượt góc (Corner Sliding) để tránh bị kẹt khấc vào mép ô lưới.

### US-02: Đặt bom và kích hoạt vụ nổ
- **Là một**: Người chơi
- **Tôi muốn**: Nhấn phím Space để thả bom tại vị trí đang đứng.
- **Để**: Phá hủy gạch mềm và tiêu diệt quái vật.
- **Tiêu chí chấp nhận**:
  - Quả bom luôn tự động canh chỉnh vào chính giữa ô lưới (Grid Snapping) gần nhất.
  - Người chơi không thể đặt số lượng bom vượt quá chỉ số tối đa cho phép hiện tại (mặc định ban đầu là 1 quả).
  - Quả bom phát hoạt ảnh nhấp nháy trong 3 giây rồi phát nổ.
  - Tia lửa nổ lan truyền theo 4 hướng hình chữ thập (+). Tầm nổ mặc định ban đầu là 1 ô (tính từ tâm).
  - Tia lửa bị chặn lại bởi Tường cứng.
  - Tia lửa phá hủy Gạch mềm đầu tiên gặp phải trên đường đi và dừng lại tại đó (không xuyên qua gạch mềm tiếp theo).
  - Tia lửa kích nổ ngay lập tức bất kỳ quả bom nào khác nằm trong phạm vi ảnh hưởng (Phản ứng dây chuyền).

### US-03: Nhặt vật phẩm nâng cấp
- **Là một**: Người chơi
- **Tôi muốn**: Thu thập các vật phẩm xuất hiện sau khi phá hủy gạch mềm.
- **Để**: Gia tăng sức mạnh chiến đấu của nhân vật.
- **Tiêu chí chấp nhận**:
  - Gạch mềm khi vỡ có tỷ lệ xác suất (khoảng 30%) rơi ra 1 trong 3 loại vật phẩm (Bomb Up, Fire Up, Speed Up).
  - Khi nhân vật chạm vào vật phẩm, vật phẩm biến mất, phát hiệu ứng âm thanh và chỉ số của nhân vật được cập nhật ngay lập tức.
  - Nếu tia lửa bom chạm vào vật phẩm đang nằm trên sàn, vật phẩm sẽ bị thiêu rụi và biến mất.

### US-04: Tương tác với quái vật
- **Là một**: Người chơi
- **Tôi muốn**: Quái vật tự động tuần tra và có hành vi thách thức.
- **Để**: Tạo ra thử thách chiến thuật và kịch tính trong màn chơi.
- **Tiêu chí chấp nhận**:
  - Quái vật Ballom di chuyển ngẫu nhiên, không thể đi xuyên tường/gạch.
  - Quái vật Oneal có tầm nhìn: nếu người chơi lọt vào cùng hàng/cột trong khoảng cách 4 ô mà không có vật cản, Oneal sẽ tăng tốc đuổi theo.
  - Nếu nhân vật chạm vào bất kỳ quái vật nào, nhân vật mất 1 mạng ngay lập tức.
  - Nếu quái vật chạm vào tia lửa bom, quái vật bị tiêu diệt, phát hoạt ảnh chết và cộng điểm cho người chơi.

### US-05: Cửa thoát hiểm và hoàn thành màn chơi
- **Là một**: Người chơi
- **Tôi muốn**: Tìm thấy Cửa thoát hiểm sau khi dọn sạch quái vật.
- **Để**: Tiến sang màn chơi tiếp theo hoặc giành chiến thắng chung cuộc.
- **Tiêu chí chấp nhận**:
  - Cửa thoát hiểm luôn nằm ẩn dưới 1 khối gạch mềm duy nhất trong màn chơi.
  - Cửa chỉ chuyển sang trạng thái Mở (Open/Active) sau khi quái vật cuối cùng bị tiêu diệt.
  - Khi người chơi bước vào Cửa thoát hiểm mở, trò chơi hiển thị màn hình chúc mừng qua màn và tải màn chơi tiếp theo.

---

## 5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

| Tiêu chuẩn | Chỉ số yêu cầu |
| :--- | :--- |
| **Hiệu năng (Performance)** | - Duy trì ổn định 60 khung hình/giây (FPS) trên cấu hình máy tính văn phòng tiêu chuẩn.<br>- Thời gian khởi động trò chơi (Initial Load) dưới 2 giây trên mạng 3G/4G tiêu chuẩn. |
| **Kích thước gói tải (Bundle Size)** | Tổng dung lượng mã nguồn và tài nguyên đồ họa/âm thanh không vượt quá 8MB. |
| **Khả năng tương thích (Compatibility)** | Hoạt động trơn tru trên mọi trình duyệt Chromium, Gecko và WebKit hiện đại có hỗ trợ WebGL và Web Audio API. |
| **Độ tin cậy & Độ ổn định (Reliability)** | Không có lỗi rò rỉ bộ nhớ (Memory Leak) khi người chơi chơi lại nhiều màn liên tục (Restart Scene nhiều lần). |
| **Bảo mật (Security)** | Hoàn toàn chạy phía Client, không thực thi `eval()`, không nạp tài nguyên từ các nguồn bên ngoài không đáng tin cậy (CDN untrusted). Tuân thủ chính sách Content Security Policy (CSP). |
