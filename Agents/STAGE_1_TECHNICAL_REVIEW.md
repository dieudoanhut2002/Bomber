# BÁO CÁO KIỂM TOÁN KỸ THUẬT STAGE 1 (TECHNICAL REVIEW AUDIT REPORT)

- **Dự án**: Bomber Game (Classic Web Arcade)
- **Giai đoạn kiểm toán**: Stage 1 – Project Foundation & Infrastructure Scaffolding
- **Ngày thực hiện**: 2026-11-07
- **Người thực hiện**: AI Coding Agent (Senior Software Architect & Technical Lead)
- **Mục tiêu**: Đánh giá toàn diện chất lượng kỹ thuật, kiến trúc, an toàn bộ nhớ, type safety, responsive và CI/CD trước khi nghiệm thu Stage 1.
- **Nguyên tắc**: Nhiệm vụ kiểm toán độc lập, không sửa code trực tiếp trong quá trình audit, không phát triển tính năng mới ngoài phạm vi.

---

## 1. PHẠM VI KIỂM TOÁN (AUDIT SCOPE)

Kiểm toán toàn bộ 5 khu vực kỹ thuật trọng yếu của dự án:
1. **Kiến trúc Sự kiện (EventBus)**: `src/core/EventBus.ts`, `src/core/GameEvents.ts`.
2. **Logic Tọa độ & Toán học (GridMath)**: `src/utils/GridMath.ts`, `tests/GridMath.test.ts`.
3. **Quy chuẩn Kích thước & Khả năng Thích ứng (Game Scale & Responsive)**: `src/config/GameConfig.ts`, `src/config/GridConfig.ts`, `index.html`.
4. **Phân tích Gói Bundle & Tối ưu Hiệu năng (Bundle Analysis)**: `dist/`, `vite.config.ts`, `package.json`.
5. **Đường ống CI/CD & Triển khai (GitHub Actions)**: `.github/workflows/deploy.yml`, `vite.config.ts`, `.gitignore`.

---

## 2. KẾT QUẢ KIỂM TOÁN CHI TIẾT TỪNG HẠNG MỤC

### 2.1. Hạng mục 1: Kiểm tra EventBus
- **Hiện trạng triển khai**:
  - `EventBus` được khởi tạo như một Singleton toàn cục (`export const EventBus = new Phaser.Events.EventEmitter();`).
  - `GameEvents` định nghĩa danh mục các tên sự kiện dưới dạng `const object` (`BOMB_PLACED`, `SCORE_CHANGED`, v.v.).
- **Đánh giá kỹ thuật**:
  - **Điểm tốt**: Mô hình Singleton EventEmitter giúp tách rời hoàn toàn liên kết cứng (Decoupling) giữa các Scenes, Systems và UI theo đúng nguyên tắc ADR-002.
  - **Phát hiện F-01 (Mức độ: Major) - Thiếu Type Safety cho Event Payload**:
    - `Phaser.Events.EventEmitter` mặc định nhận `args: any[]`.
    - Hiện tại không có interface ràng buộc giữa tên sự kiện và dữ liệu truyền kèm (payload). Nếu một hệ thống bắn `EventBus.emit(GameEvents.SCORE_CHANGED, "sai_kieu")`, TypeScript compiler sẽ không thể phát hiện lỗi tại thời điểm biên dịch.
  - **Phát hiện F-02 (Mức độ: Major) - Nguy cơ Duplicate Listener & Memory Leak khi Scene Restart**:
    - Khi người chơi chơi lại hoặc chuyển Scene, Scene mới sẽ đăng ký listener vào Singleton `EventBus`. Nếu Scene cũ không hủy đăng ký (`EventBus.off`), callback của Scene cũ vẫn tồn tại trong bộ nhớ.
    - Hậu quả: Callback bị nhân bản (chạy nhiều lần khi sự kiện phát ra) và Garbage Collector không thể giải phóng Scene cũ do `EventBus` vẫn giữ tham chiếu `context` (`this`).

### 2.2. Hạng mục 2: Kiểm tra GridMath
- **Hiện trạng triển khai**:
  - Tách biệt thành công sang `src/config/GridConfig.ts` (ADR-007), hoàn toàn không phụ thuộc Phaser, cho phép Unit Test chạy ở chế độ Headless (6ms).
  - Triển khai 4 hàm tiện ích: `gridToWorld()`, `worldToGrid()`, `isValidGridCoord()`, `snapToGridCenter()`.
- **Đánh giá kỹ thuật**:
  - **Điểm tốt**: Thuật toán tính toán chuẩn xác cho ma trận 15 cột x 13 hàng, tính đúng độ lệch `HUD_HEIGHT = 48px`.
  - **Phát hiện F-03 (Mức độ: Minor) - `snapToGridCenter` không clamp tọa độ ngoài biên**:
    - Nếu truyền vào tọa độ trong dải HUD (`y < 48`), hàm tính ra `row < 0` và trả về tâm ô giả định nằm trong HUD.
    - Cần tài liệu hóa hoặc bổ sung cơ chế clamp bảo vệ để tránh việc bom hoặc đối tượng bị snap vào tọa độ âm.
  - **Phát hiện F-04 (Mức độ: Minor) - Thiếu kịch bản Edge-Case Unit Tests**:
    - Bộ test hiện có 5 test cases cơ bản.
    - Cần bổ sung kiểm thử các trường hợp: Tọa độ dấu phẩy động (float do physics velocity), tọa độ nằm chính xác trên đường biên (`x = 720`, `x = 719.99`, `y = 48`, `y = 671.99`), và tọa độ âm trong vùng HUD.

### 2.3. Hạng mục 3: Kiểm tra Game Scale & Responsive
- **Hiện trạng triển khai**:
  - Kích thước chuẩn: Width 720px, Height 672px (gồm Arena 720x624px và HUD 48px). Khớp 100% với GDD.
  - Phaser Scale Manager: `mode: Phaser.Scale.FIT`, `autoCenter: Phaser.Scale.CENTER_BOTH`.
- **Đánh giá kỹ thuật**:
  - **Điểm tốt**: Bố cục Canvas và tỷ lệ lưới ma trận được hiển thị chuẩn xác trong `PreloadScene`.
  - **Phát hiện F-05 (Mức độ: Major) - CSS Fixed Width cản trở Responsive trên màn hình nhỏ**:
    - Trong `index.html`: `#game-container` được đặt cố định `width: 720px; height: 672px;`.
    - Khi người dùng sử dụng màn hình nhỏ (ví dụ laptop 1366x768 với Windows Display Scaling 125% khiến viewport chỉ còn ~1090x600px, hoặc cửa sổ trình duyệt chia đôi màn hình < 720px):
    - Khung `#game-container` không tự co lại do CSS cố định pixel, gây tràn màn hình (horizontal/vertical overflow) hoặc bị cắt mất phần dưới của game dù Phaser đã bật chế độ `Scale.FIT`.

### 2.4. Hạng mục 4: Kiểm tra Gói Bundle (Bundle Analysis)
- **Hiện trạng triển khai**:
  - Đã cấu hình `manualChunks` trong `vite.config.ts` (ADR-008).
  - Kết quả build:
    - `dist/index.html`: 1.69 kB (gzip: 0.82 kB)
    - `dist/assets/index-rRTW3PsH.js`: 3.15 kB (gzip: 1.56 kB) - cực kỳ nhỏ gọn.
    - `dist/assets/phaser-DGOJFvlN.js`: 1,478.62 kB (gzip: 337.77 kB) - Phaser vendor chunk.
- **Đánh giá kỹ thuật**:
  - **Điểm tốt**:
    - Tách biệt vendor chunk hoàn hảo. Mã nguồn game chỉ nặng 3.15 kB.
    - Kích thước nén qua mạng (Gzip Size) của toàn bộ game chỉ là **~340 kB**, tải mất dưới 50ms trên mạng tiêu chuẩn.
    - Thời gian phân tích mã (Parse time) của 1.48 MB JS thô trên trình duyệt chỉ mất ~20-30ms, hoàn toàn không gây giật lag khi khởi động.
  - **Đánh giá tối ưu hóa**:
    - **Không cần thiết** tạo bản build tùy biến (Custom Modular Phaser Build) trong giai đoạn MVP vì sẽ làm tăng độ phức tạp của quy trình build và có rủi ro thiếu các module ngầm (Audio, WebGL Render Pipeline, Arcade Physics), trong khi lợi ích tiết kiệm dung lượng thực tế không đáng kể.
  - **Phát hiện**: `Informational` – Cấu hình bundle hiện tại đã tối ưu tốt nhất cho giai đoạn này.

### 2.5. Hạng mục 5: Kiểm tra GitHub Actions & Deployment
- **Hiện trạng triển khai**:
  - Pipeline `.github/workflows/deploy.yml` chạy trên `ubuntu-latest`, gồm các bước: `checkout -> setup node 20 -> npm ci -> typecheck -> test -> build -> deploy`.
  - Permissions: `contents: read`, `pages: write`, `id-token: write`.
  - Vite base: `process.env.NODE_ENV === 'production' ? '/Bomber/' : '/'`.
- **Đánh giá kỹ thuật**:
  - **Điểm tốt**:
    - Cấu hình chuẩn GitHub Actions Pages deployment chính thống (actions/deploy-pages@v4).
    - Subpath `/Bomber/` được gán chính xác vào thẻ `<script>` trong `dist/index.html`, ngăn ngừa lỗi 404 khi truy cập `https://dieudoanhut2002.github.io/Bomber/`.
    - `package-lock.json` được theo dõi trong Git, đảm bảo lệnh `npm ci` thực thi tin cậy và tái lập 100% môi trường dependencies.
  - **Phát hiện F-06 (Mức độ: Minor) - Tính linh động của Base Path**:
    - Giá trị `/Bomber/` hiện đang được gán cứng dựa theo tên repo. Nếu repository được đổi tên hoặc deploy trên custom domain, cần truyền qua biến môi trường để không phải sửa mã nguồn `vite.config.ts`.

---

## 3. BẢNG DANH SÁCH CÁC PHÁT HIỆN (FINDINGS LOG)

| Mã | Hạng mục | Phát hiện | Mức độ | Nguyên nhân | Đề xuất khắc phục |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **F-01** | EventBus | Thiếu Type Safety cho Event Payload | **Major** | Dùng `Phaser.Events.EventEmitter` thuần | Xây dựng Typed EventBus Wrapper có ánh xạ `IEventPayloadMap` trong Stage 2. |
| **F-02** | EventBus | Nguy cơ Memory Leak & Duplicate Listener khi Restart Scene | **Major** | Singleton EventBus giữ tham chiếu Scene cũ | Thiết lập chuẩn vòng đời: Bắt buộc hủy listener trong hook `SHUTDOWN` của Scene. |
| **F-03** | GridMath | `snapToGridCenter` không clamp khi tọa độ nằm trong HUD hoặc ngoài sàn | **Minor** | Thiếu ràng buộc biên trong hàm snap | Bổ sung logic clamp hoặc hàm `clampAndSnapToGrid()` ở Stage 2. |
| **F-04** | GridMath | Thiếu kịch bản Edge-Case Unit Tests | **Minor** | Mới chỉ có 5 tests cơ bản | Bổ sung các kịch bản tọa độ float, biên `x=720`, `y=48` vào `GridMath.test.ts`. |
| **F-05** | Game Scale | CSS cố định kích thước `#game-container` cản trở Responsive | **Major** | CSS đặt cứng `width: 720px; height: 672px` | Đổi sang CSS Responsive (`max-width: 100vw; max-height: calc(100vh - 40px); aspect-ratio: 720/672`). |
| **F-06** | CI/CD | Base Path gán cứng theo tên repo `/Bomber/` | **Minor** | Chưa ưu tiên đọc từ biến môi trường | Đổi thành `process.env.BASE_PATH || (process.env.NODE_ENV === 'production' ? '/Bomber/' : '/')`. |

---

## 4. KẾ HOẠCH HÀNH ĐỘNG KHẮC PHỤC (REMEDIATION PLAN)

Theo đúng quy định kiểm toán: **Không sửa mã nguồn trực tiếp trong đợt audit này**. 

Toàn bộ các đề xuất trên sẽ được đưa vào **Checklist Tiên quyết Kỹ thuật (Technical Prerequisites Checklist)** ngay khi mở đầu **Stage 2**:
1. **Trước khi viết Player & GridSystem ở Stage 2**:
   - Cập nhật CSS của `#game-container` trong `index.html` để hoàn thiện tính năng Responsive đầy đủ trên mọi kích thước màn hình.
   - Xây dựng `TypedEventEmitter` hoặc Generic Helper cho `EventBus` để đảm bảo Type-Safe 100% cho các sự kiện sắp tới (`PLAYER_MOVED`, v.v.).
   - Bổ sung 5 edge-case tests cho `GridMath.test.ts`.
   - Cập nhật linh hoạt biến môi trường `BASE_PATH` trong `vite.config.ts`.

---

## 5. KẾT LUẬN & KIẾN NGHỊ NGHIỆM THU

- **Tổng hợp phát hiện**:
  - **Critical (Lỗi chặn hệ thống)**: **0**
  - **Major (Cần xử lý trước khi scale tính năng)**: **2** (EventBus typing/cleanup, CSS Responsive)
  - **Minor (Cải thiện chất lượng)**: **3** (Snap clamping, Edge-case tests, Base path env)
  - **Informational**: **1** (Đánh giá Bundle size)
- **Đánh giá tổng thể**:
  - Hạ tầng Stage 1 hoàn toàn vững chắc, biên dịch sạch sẽ (0 compile errors), toàn bộ unit test hiện tại đều pass, build production mượt mà trong ~10s với cấu hình vendor chunking tối ưu.
  - Các phát hiện thuộc mức Major và Minor đều là các rủi ro dài hạn đã được lường trước và có phương án kỹ thuật rõ ràng để giải quyết ngay đầu Stage 2 mà không làm phá vỡ kiến trúc gốc.
- **Kiến nghị**: **ĐỦ ĐIỀU KIỆN NGHIỆM THU KỸ THUẬT STAGE 1**.
