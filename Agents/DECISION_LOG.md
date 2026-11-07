# NHẬT KÝ QUYẾT ĐỊNH KIẾN TRÚC (ARCHITECTURAL DECISION LOG - ADR)

> Tài liệu này ghi lại toàn bộ các quyết định kỹ thuật và kiến trúc quan trọng được đưa ra trong suốt vòng đời của dự án **Bomber Game**, giải thích bối cảnh, lý do lựa chọn và hệ quả của từng quyết định.

---

## 📑 MỤC LỤC CÁC QUYẾT ĐỊNH

- [ADR-001: Lựa chọn Game Engine (Phaser 3 + TypeScript + Vite)](#adr-001)
- [ADR-002: Mô hình Kiến trúc Phân tầng kết hợp Event-Driven (EventBus)](#adr-002)
- [ADR-003: Cơ chế Va chạm Lai (Hybrid Collision) & Thuật toán Trượt góc](#adr-003)
- [ADR-004: Kiến trúc Hoàn toàn Phía Client (Client-Only MVP & LocalStorage)](#adr-004)
- [ADR-005: Chiến lược Tự động hóa Triển khai (GitHub Actions & GitHub Pages)](#adr-005)
- [ADR-006: Tinh gọn Cấu trúc Thư mục Gốc của Repository](#adr-006)

---

### <a id="adr-001"></a>ADR-001: Lựa chọn Game Engine (Phaser 3 + TypeScript + Vite)

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Cần xây dựng một tựa game 2D retro cổ điển chạy trên trình duyệt web, yêu cầu thời gian phát triển nhanh, hiệu năng ổn định 60 FPS, hỗ trợ tốt TypeScript và dễ dàng đóng gói, kiểm thử.
- **Lựa chọn cân nhắc**:
  1. *HTML5 Canvas thuần (Vanilla Canvas API)*: Nhẹ nhất nhưng phải tự viết toàn bộ Sprite, Physics, Audio, Animation từ đầu, tốn kém thời gian không cần thiết.
  2. *PixiJS*: Khả năng render 2D cực mạnh nhưng thiếu sẵn các hệ sinh thái game như Arcade Physics, Tilemap và Audio Management tích hợp.
  3. *Phaser 3*: Game framework mã nguồn mở hoàn thiện nhất cho web 2D, tích hợp sẵn Arcade Physics, Scene Manager, Audio Manager, Camera System, và cộng đồng hỗ trợ lớn.
- **Quyết định**:
  Sử dụng **Phaser 3** kết hợp cùng **TypeScript** và **Vite**:
  - Phaser 3 cung cấp đầy đủ công cụ phục vụ game retro.
  - TypeScript đảm bảo kiểm soát kiểu chặt chẽ (strict typing) và giảm thiểu lỗi runtime.
  - Vite cung cấp máy chủ phát triển với Hot Module Replacement (HMR) tức thì và tối ưu hóa đóng gói tĩnh vượt trội so với Webpack.
- **Hệ quả**:
  - Tốc độ phát triển được đẩy nhanh tối đa.
  - Cần chú ý tuân thủ kiến trúc tách rời Scene khỏi System để tránh mã nguồn bị dồn ứ vào các lớp của Phaser.

---

### <a id="adr-002"></a>ADR-002: Mô hình Kiến trúc Phân tầng kết hợp Event-Driven (EventBus)

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Nhiều dự án Phaser thường mắc lỗi "Monolithic Scene" – đưa toàn bộ logic di chuyển, nổ bom, tính điểm, âm thanh vào một tệp `GameScene.ts` dài hàng nghìn dòng, khiến việc bảo trì, mở rộng và kiểm thử tự động trở nên bất khả thi đối với cả kỹ sư lẫn AI Coding Agent.
- **Quyết định**:
  Áp dụng mô hình phân tách 4 tầng rõ rệt:
  1. **Scenes**: Chỉ điều phối vòng đời (Lifecycle) và hiển thị.
  2. **Systems**: Xử lý logic thuần túy độc lập (`GridSystem`, `BombSystem`, `ScoreSystem`, v.v.).
  3. **Entities**: Đại diện cho các đối tượng hiển thị và hoạt ảnh (`Player`, `Bomb`, `Enemy`).
  4. **EventBus**: Sử dụng cơ chế phát/lắng nghe sự kiện để liên lạc bất đồng bộ giữa các tầng.
- **Hệ quả**:
  - Không có sự phụ thuộc vòng lặp giữa các mô-đun.
  - Thuật toán logic có thể đem ra chạy Unit Test bằng Vitest mà không cần dựng Scene hay Canvas giả lập.
  - Dễ dàng mở rộng thêm màn chơi, loại quái vật mới hoặc vật phẩm mới mà không làm ảnh hưởng code cũ.

---

### <a id="adr-003"></a>ADR-003: Cơ chế Va chạm Lai (Hybrid Collision) & Thuật toán Trượt góc

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Game Bomberman đòi hỏi hai đặc tính tưởng chừng mâu thuẫn:
  - Bản đồ và bom hoạt động theo dạng **ô lưới rời rạc (Discrete Grid)** (bom chỉ nằm đúng giữa ô, tia lửa lan theo từng ô trọn vẹn).
  - Nhưng việc di chuyển của nhân vật cần phải **mượt mà liên tục (Continuous Arcade Movement)**. Nếu dùng hitbox vuông đúng bằng kích thước ô lưới (48x48), nhân vật sẽ liên tục bị "kẹt cứng" vào các góc tường khi đổi hướng rẽ, gây ức chế cho người chơi.
- **Quyết định**:
  Triển khai mô hình va chạm lai:
  1. Duy trì ma trận 2D số học `TileType[][]` để quản lý logic ô lưới, nổ bom và đường ngắm AI.
  2. Dùng Arcade Physics với Hitbox thu nhỏ (`28x28` pixel trên khung hình 48x48) cho Player.
  3. Bổ sung thuật toán **Corner Sliding**: Tự động bù vận tốc theo phương vuông góc khi người chơi đi sạt vào góc khối đá lệch tâm dưới 14px để tự động trượt vào hành lang trống.
- **Hệ quả**:
  - Trải nghiệm điều khiển đạt độ mượt mà cao như các phiên bản Bomberman trên hệ máy console SNES/GBA.
  - Đảm bảo tính toán vụ nổ bom vẫn chính xác tuyệt đối theo từng ô lưới logic.

---

### <a id="adr-004"></a>ADR-004: Kiến trúc Hoàn toàn Phía Client (Client-Only MVP & LocalStorage)

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Giai đoạn MVP cần tập trung cao độ vào trải nghiệm chơi game (Core Gameplay) và khả năng triển khai tức thì mà không tạo gánh nặng chi phí vận hành máy chủ backend.
- **Quyết định**:
  Toàn bộ game chạy 100% phía Client trên trình duyệt web:
  - Không sử dụng cơ sở dữ liệu bên ngoài hay máy chủ API.
  - Điểm cao kỷ lục (High Score) và cấu hình âm thanh (Mute/Volume) được lưu trữ trực tiếp vào `window.localStorage` của trình duyệt.
- **Hệ quả**:
  - Chi phí lưu trữ và vận hành bằng 0.
  - Trò chơi có thể chơi ngoại tuyến (Offline) ngay cả khi mất mạng internet sau lần tải đầu tiên.
  - Kiến trúc sẵn sàng bổ sung Backend API cho bảng xếp hạng trực tuyến ở các phiên bản hậu MVP (Post-MVP).

---

### <a id="adr-005"></a>ADR-005: Chiến lược Tự động hóa Triển khai (GitHub Actions & GitHub Pages)

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Dự án cần quy trình phát hành liên tục, tự động hóa hoàn toàn từ mã nguồn đến môi trường công khai mà không đòi hỏi thao tác thủ công phức tạp.
- **Quyết định**:
  Xây dựng pipeline CI/CD bằng **GitHub Actions** triển khai trực tiếp lên **GitHub Pages**:
  - Khi có commit đẩy lên nhánh `main`, GitHub Actions tự động kích hoạt workflow `.github/workflows/deploy.yml`.
  - Quy trình chạy: `npm ci` -> `npm run typecheck` -> `npm run test` -> `npm run build` -> Đẩy thư mục `dist/` lên GitHub Pages.
- **Hệ quả**:
  - Bất kỳ lỗi biên dịch (Compile Error) hoặc lỗi kiểm thử (Failed Test) nào cũng sẽ ngăn chặn việc triển khai hỏng ra môi trường thực tế.
  - Mọi người dùng đều có thể truy cập trải nghiệm sản phẩm ngay tại địa chỉ web công khai.

---

### <a id="adr-006"></a>ADR-006: Tinh gọn Cấu trúc Thư mục Gốc của Repository

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Quá trình khởi tạo ban đầu tạo ra cấu trúc thư mục lồng nhau (`G:\GIT\Bomber\Bomber\.git`), gây khó khăn và nhầm lẫn khi người dùng thao tác lệnh `cd G:\GIT\Bomber` hoặc khi các công cụ tự động hóa nhận diện gốc dự án (Repository Root).
- **Quyết định**:
  Chuyển toàn bộ tệp `.git` và `.gitignore` lên thẳng thư mục `G:\GIT\Bomber`, đồng thời xóa thư mục lồng không cần thiết. Đặt `G:\GIT\Bomber` làm thư mục gốc chính thức và duy nhất của dự án.
- **Hệ quả**:
  - Cấu trúc repository sạch sẽ, chuẩn mực, trực quan cho cả kỹ sư và AI Coding Agent.
