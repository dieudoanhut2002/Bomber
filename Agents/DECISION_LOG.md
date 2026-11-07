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
- [ADR-007: Tách biệt Cấu hình Lưới (GridConfig) Phục vụ Kiểm thử Đơn vị Headless](#adr-007)
- [ADR-008: Tối ưu Phân đoạn Gói Bundle Vite (Phaser Vendor Chunking)](#adr-008)
- [ADR-009: Triển khai TypedEventBus Độc lập & Tự động Giải phóng Vòng đời Scene](#adr-009)
- [ADR-010: Mô hình Bản Đồ Bất Biến (GameMap) & Thuật Toán Sinh Bản Đồ Tất Định (MapGenerator PRNG)](#adr-010)
- [ADR-011: Kiến Trúc Player Entity, Thuật Toán Trượt Góc (Corner Sliding) & Xử Lý Input Trực Giao](#adr-011)

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


---

### <a id="adr-007"></a>ADR-007: Tách biệt Cấu hình Lưới (GridConfig) Phục vụ Kiểm thử Đơn vị Headless

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Trong Stage 1, việc `GridMath.ts` import trực tiếp `GAME_DIMENSIONS` từ `GameConfig.ts` (nơi nạp `Phaser`) khiến cho công cụ kiểm thử Vitest trong môi trường `node` báo lỗi `ReferenceError: navigator is not defined` do Phaser cố gắng khởi tạo device detection khi file được nạp.
- **Quyết định**:
  Tách các hằng số kích thước hình học thuần túy (`TILE_SIZE`, `GRID_COLS`, `GRID_ROWS`, `HUD_HEIGHT`, `WIDTH`, `HEIGHT`) sang tệp độc lập `src/config/GridConfig.ts`. `GameConfig.ts` và các module logic khác re-export và sử dụng lại tệp này.
- **Hệ quả**:
  - Tuân thủ 100% nguyên tắc Clean Architecture và Headless Logic Separation: logic toán học và ma trận chạy độc lập, siêu tốc dưới 10ms trong Vitest mà không cần mock browser DOM / navigator.

---

### <a id="adr-008"></a>ADR-008: Tối ưu Phân đoạn Gói Bundle Vite (Phaser Vendor Chunking)

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Phaser có dung lượng nén khoảng ~1.4MB. Nếu gộp chung vào bundle `index.js`, mỗi lần cập nhật mã nguồn nhỏ thì trình duyệt của người dùng đều phải tải lại toàn bộ 1.4MB thư viện.
- **Quyết định**:
  Cấu hình `rollupOptions.output.manualChunks` trong `vite.config.ts` để phân tách `phaser` thành chunk riêng biệt (`phaser-*.js`), đồng thời mã nguồn trò chơi nằm trong `index-*.js` (chỉ ~3KB).
- **Hệ quả**:
  - Tối ưu hóa bộ nhớ đệm (Browser Cache) tối đa cho người chơi.
  - Loại bỏ hoàn toàn cảnh báo dung lượng chunk từ Rollup/Vite.


---

### <a id="adr-009"></a>ADR-009: Triển khai TypedEventBus Độc lập & Tự động Giải phóng Vòng đời Scene

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Kiểm toán Stage 1 (Finding F-01 & F-02) chỉ ra hai rủi ro lớn:
  1. `Phaser.Events.EventEmitter` thiếu ràng buộc kiểu (weakly typed), khiến sự kiện và payload dễ bị lệch kiểu dữ liệu tại runtime.
  2. Singleton EventBus lưu trữ tham chiếu Scene cũ khi Scene restart, gây ra duplicate callback và rò rỉ bộ nhớ nghiêm trọng (Memory Leak).
- **Quyết định**:
  1. Xây dựng lớp `TypedEventBus` độc lập bằng TypeScript thuần túy, định nghĩa interface `IEventPayloadMap` ràng buộc 100% type-safe cho `on`, `once`, `off`, `emit`.
  2. Bổ sung phương thức `listen(scene, event, fn, context)`: Tự động đăng ký hook vào sự kiện `shutdown` và `destroy` của Scene để tự động hủy lắng nghe ngay khi Scene kết thúc vòng đời.
  3. Loại bỏ việc import `Phaser` trong `EventBus.ts`, giúp mô-đun sự kiện hoàn toàn không phụ thuộc DOM/navigator, chạy headless tức thì trong Unit Test.
- **Hệ quả**:
  - Triệt tiêu 100% rủi ro memory leak và duplicate listeners khi restart game hoặc qua màn.
  - Trình biên dịch TypeScript bắt lỗi ngay lập tức nếu truyền sai payload của sự kiện.


---

### <a id="adr-010"></a>ADR-010: Mô hình Bản Đồ Bất Biến (GameMap) & Thuật Toán Sinh Bản Đồ Tất Định (MapGenerator PRNG)

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Trong Stage 2B, hệ thống cần biểu diễn ma trận bản đồ 15x13 độc lập với Phaser, đồng thời hỗ trợ sinh bản đồ có yếu tố ngẫu nhiên nhưng phải có khả năng tái lập 100% để phục vụ kiểm thử tự động (Unit Test) và chế độ nhiều màn chơi.
- **Quyết định**:
  1. Phân tách rõ ràng giữa:
     - `GameMap`: Cấu trúc dữ liệu thuần túy (Map Representation), áp dụng Deep Copy khi khởi tạo và trích xuất (`cloneTiles()`, `toData()`) để bảo vệ dữ liệu chống lại mutation ngoài ý muốn.
     - `GridSystem`: Hệ thống xử lý logic runtime (kiểm tra Walkable, Destructible, phá hủy gạch mềm, mở khóa cửa).
     - `MapGenerator`: Thuật toán sinh ma trận địa hình tuân thủ quy chuẩn GDD (tường bao, trụ cột chẵn, vùng an toàn 3 ô, gạch mềm theo stage, ẩn cửa thoát hiểm).
  2. Xây dựng lớp `PRNG` (thuật toán Mulberry32 + FNV-1a hash): Cho phép truyền seed chuỗi hoặc số để sinh bản đồ tất định (cùng seed -> kết quả giống hệt 100%), không phụ thuộc vào `Math.random()`.
- **Hệ quả**:
  - Toàn bộ logic lưới và sinh bản đồ chạy Headless 100%, kiểm thử 39 tests chỉ mất vài chục ms trong Vitest.
  - Đảm bảo tính nhất quán của dữ liệu trò chơi, không có hiện tượng rò rỉ trạng thái (State Leak).


---

### <a id="adr-011"></a>ADR-011: Kiến Trúc Player Entity, Thuật Toán Trượt Góc (Corner Sliding) & Xử Lý Input Trực Giao

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Trong Stage 2C, việc điều khiển nhân vật Bomberman đòi hỏi:
  1. Xử lý va chạm chính xác với ma trận ô lưới bằng Hitbox thu nhỏ 28x28 (căn giữa trên tile 48x48) với offset 10px.
  2. Thuật toán trượt góc (Corner Sliding) mượt mà khi người chơi đâm vào góc tường nhưng lệch tâm dưới 14px (theo GDD 3.1).
  3. Xử lý input khi bấm đồng thời 2 phím vuông góc (ví dụ: giữ RIGHT và nhấn UP).
  4. Ngăn chặn hiện tượng xuyên thấu vật cản (Tunneling) khi frame rate thấp hoặc delta time lớn.
- **Quyết định**:
  1. Phân tách rõ ràng:
     - `PlayerInputSystem` & `OrthogonalInputResolver`: Quản lý ngăn xếp phím nhấn (Last-In-First-Out). Hướng mới nhấn sẽ được ưu tiên thực thi, khi thả ra sẽ tự động quay về hướng đang giữ trước đó.
     - `PlayerCollisionSystem`: Chịu trách nhiệm kiểm tra AABB vs ô lưới, giải quyết va chạm độc lập với Phaser, hỗ trợ Sub-stepping (bước tối đa 4px) loại bỏ 100% rủi ro Tunneling.
     - `Player`: Thực thể kế thừa Arcade Physics Sprite, nhận kết quả di chuyển từ `PlayerCollisionSystem` và đồng bộ animation 4 hướng.
  2. Cơ chế Corner Sliding:
     - Khi di chuyển theo trục chính bị chặn bởi Tường cứng hoặc Gạch mềm: nếu độ lệch tâm vuông góc `|offset| <= 14px`, hệ thống kiểm tra ô góc chéo tiếp theo có trống hay không. Nếu trống, tự động bù chuyển động theo phương vuông góc để người chơi trượt nhẹ nhàng vào hành lang mà không bị khựng lại.
- **Hệ quả**:
  - Cảm giác điều khiển đạt chuẩn arcade cổ điển: phản hồi cực nhanh, trượt góc mượt mà, không bao giờ bị kẹt khấc hay lọt qua khe hẹp.
  - Toàn bộ logic va chạm và trượt góc được kiểm thử tự động 100% trong Vitest mà không cần mở trình duyệt.


---

### <a id="adr-012"></a>ADR-012: Thống Nhất Quyền Kiểm Soát Vị Trí (Kinematic Arcade Body) & Căn Giữa Hành Lang (Corridor Entry Auto-Centering)

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Kết quả Technical Audit của Stage 2C (`Agents/STAGE_2C_TECHNICAL_AUDIT.md`) phát hiện 5 vấn đề kỹ thuật cần được gia cố trước khi triển khai Stage 3:
  1. **AUD-01**: Arcade Physics Dynamic Body đang chạy ngầm integration có nguy cơ xung đột quyền kiểm soát vị trí (fighting authority) với `PlayerCollisionSystem`.
  2. **AUD-02**: Cơ chế Corner Sliding trước đó chỉ xử lý T-Junction Rounding (khi ô trước mặt bị chặn thì trượt sang ô mở), nhưng chưa có Corridor Entry Auto-Centering (khi ô trước mặt là hành lang mở nhưng người chơi lệch tâm lấn vào tường bên cạnh).
  3. **AUD-03**: `forwardCol` / `forwardRow` tính từ tọa độ hiện tại có nguy cơ sai số do làm tròn số thực.
  4. **AUD-04**: `deltaSeconds` chưa được clamp chặn trên khiến lag spike hoặc tab switch có thể làm lặp sub-stepping quá mức.
  5. **AUD-05**: Thiếu bộ unit test đối xứng cho các hướng LEFT, UP và kiểm tra ngưỡng biên 14px / 15px.
- **Quyết định**:
  1. **Xác lập Nguồn Quyền Lực Duy Nhất (Single Authority) về Vị trí Player**:
     - Thiết lập `(this.body as Phaser.Physics.Arcade.Body).moves = false` trong `Player.ts:setupHitbox()`.
     - Arcade Physics Body trở thành Kinematic Sensor Body: không tự ý tích lũy vận tốc, không bị tác động bởi trọng lực hay phân tách va chạm (separation force) của Phaser physics step. Vị trí body được đồng bộ 100% theo `Player.setPosition()`.
     - Arcade Body giữ vai trò duy nhất là Sensor Trigger phục vụ các tương tác Overlap (thu thập Item/Power-up, dính tia lửa Bom, va chạm Quái vật) ở Stage 3 và Stage 5.
  2. **Phân tách và triển khai 2 cơ chế trượt góc độc lập trong `PlayerCollisionSystem.tryCornerSliding()`**:
     - **Corridor Entry Auto-Centering (AUD-02)**: Khi ô thẳng phía trước là `WALKABLE` nhưng player bị vướng tường mép cạnh do lệch tâm (`|offset| <= 14px`), hệ thống tự động bù vận tốc ngược chiều lệch để kéo player về chính giữa tâm ô (`rowCenterY` hoặc `colCenterX`).
     - **T-Junction Corner Rounding**: Khi ô thẳng phía trước là `BLOCKED` (tường cản), hệ thống kiểm tra ô góc vuông chéo; nếu ô đó mở, bù vận tốc cùng chiều để player trượt vòng qua góc vào hành lang mới.
  3. **Tọa độ đích cho thuật toán trượt góc (AUD-03)**:
     - Sử dụng tọa độ đích (`targetX`, `targetY`) kết hợp toán tử biên `Math.max` / `Math.min` để xác định chính xác ô đang hướng tới, triệt tiêu hoàn toàn lỗi sai số số thực.
  4. **Chặn trần thời gian frame (AUD-04)**:
     - Giới hạn `deltaSeconds = Math.min(Math.max(0, deltaSeconds), 0.1)` ở cả `GameScene.ts` và `PlayerCollisionSystem.ts`, khống chế số bước sub-stepping tối đa là 3, triệt tiêu nguy cơ freeze hay lag spike.
  5. **Bổ sung trọn vẹn 16 unit tests mới (AUD-05)**:
     - Mở rộng test suite lên 82 tests pass 100% với độ bao phủ đối xứng cho toàn bộ 4 hướng di chuyển và ranh giới ngưỡng trượt góc.
- **Hệ quả**:
  - Phân định ranh giới trách nhiệm tuyệt đối rõ ràng giữa Custom Kinematic Movement và Arcade Sensor Triggers. Sẵn sàng cho Stage 3 (Bombs) và Stage 5 (Enemies).
  - Trải nghiệm di chuyển mượt mà tối đa: người chơi tự động lọt vào hành lang 1 ô hẹp mà không cần căn chỉnh pixel hoàn hảo.
  - Dự án đạt độ tin cậy và ổn định cao trước mọi tình huống lag spike hay switch tab.


---

### <a id="adr-013"></a>ADR-013: Kiến Trúc Phân Hệ Bom & Vụ Nổ (Spatial Disjoint Pass-through, BFS Chain Reaction & Cell-based Visual Stacking)

- **Trạng thái**: ĐÃ CHẤP THUẬN (APPROVED)
- **Ngày quyết định**: 2026-11-07
- **Bối cảnh**:
  Trong Stage 3A, Tech Lead và Game Architect cần chốt 3 quyết định kiến trúc then chốt để chuẩn bị triển khai Stage 3B:
  1. **DECISION 1**: Cơ chế đi xuyên quả bom vừa đặt (Pass-through). Quy tắc cũ trong GDD 3.2 (dùng timer 0.2s) gây rủi ro kẹt chết oan nếu người chơi đứng yên suy nghĩ hoặc gặp lag spike.
  2. **DECISION 2**: Hành vi khi tia lửa nổ chạm vào quả bom khác. Cần xác định tính chất xuyên tia nổ và giải pháp loại bỏ đệ quy vô hạn khi kích nổ dây chuyền.
  3. **DECISION 3**: Xử lý nhiều vụ nổ cùng chiếm một ô lưới (Visual Stacking). Cần tránh chói lóa và quá tải render nhưng tuyệt đối không làm mất trạng thái gameplay.
- **Quyết định**:
  1. **Spatial Disjoint AABB Pass-through (Bãi bỏ Timer 0.2s)**:
     - Bãi bỏ hoàn toàn quy tắc đếm giờ 0.2s.
     - Player vừa đặt bom được quyền đi lại trên ô chứa quả bom đó cho đến khi toàn bộ AABB của Player không còn giao cắt với Bounding Box của ô bom (bước hoàn toàn ra ngoài ô bom).
     - Ngay khi rời khỏi ô bom, quả bom lập tức hóa rắn (`isWalkable = false`), Player không thể quay lại khi bom còn tồn tại.
     - Quyền đi xuyên được quản lý độc lập theo từng Player và từng Bomb (`playerBombPassThrough: Map<playerId, Set<bombId>>`). Các thực thể khác (quái vật, người chơi khác) bị chặn cứng ngay từ đầu.
     - Hồi lại `bombCapacity` cho Player ngay thời điểm bom phát nổ (`EXPLODING`).
     - Ô trên `GridSystem` được giải phóng về `TileType.EMPTY` ngay thời điểm bom phát nổ (`EXPLODING`).
  2. **Non-recursive BFS Chain Reaction & Penetrating Blast**:
     - Quả bom bị tia lửa quét trúng sẽ chuyển ngay sang `TRIGGERED` và nổ tức thì.
     - Tia lửa tiếp tục lan qua ô chứa quả bom nếu vẫn còn tầm nổ (`TileType.BOMB.blocksBlast = false`).
     - Sử dụng thuật toán hàng đợi BFS (Breadth-First Search) phi đệ quy kết hợp `Set<string>` đánh dấu `processedBombIds` để đảm bảo độ phức tạp `O(N)`, loại bỏ 100% nguy cơ Stack Overflow và không bao giờ xử lý một quả bom 2 lần.
  3. **Cell-based Visual Stacking & State Contribution Tracking**:
     - Quản lý vụ nổ tại mỗi ô lưới bằng mô hình `CellExplosionTracker`.
     - Gộp hiển thị (visual representation) theo ô để tối ưu render canvas và tự động chọn hình dạng tia lửa (cross, body, tip).
     - Bảo toàn đầy đủ danh sách `contributions` của từng vụ nổ trên ô.
     - Visual sprite của ô chỉ bị xóa khi toàn bộ các vụ nổ trên ô đó kết thúc (`activeCount === 0`).
- **Hệ quả**:
  - Trải nghiệm di chuyển và đặt bom đạt chuẩn 100% Bomberman arcade cổ điển, không bao giờ xảy ra lỗi kẹt bom.
  - Thuật toán nổ dây chuyền an toàn tuyệt đối, kiểm thử độc lập Headless trong Vitest.
  - Hiệu năng rendering tối ưu, không có hiện tượng giật lag khi hàng chục quả bom cùng kích nổ.
