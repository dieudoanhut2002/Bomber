# LỘ TRÌNH TRIỂN KHAI DỰ ÁN (IMPLEMENTATION ROADMAP)

> **QUY TẮC BẮT BUỘC**: Mỗi Stage chỉ được coi là hoàn thành khi đáp ứng đầy đủ tất cả **Tiêu chí nghiệm thu (Acceptance Criteria)**. AI Agent **PHẢI DỪNG LẠI (HALT)** ở cuối mỗi Stage để báo cáo kết quả và chỉ bắt đầu Stage kế tiếp khi người dùng phê duyệt rõ ràng.

---

## TỔNG QUAN CÁC GIAI ĐOẠN

```mermaid
flowchart LR
    S0["Stage 0\nPhân tích & Docs"] --> S1["Stage 1\nScaffolding & CI/CD"]
    S1 --> S2["Stage 2\nGrid & Player Move"]
    S2 --> S3["Stage 3\nBom & Vụ Nổ"]
    S3 --> S4["Stage 4\nItems & Cổng Thoát"]
    S4 --> S5["Stage 5\nQuái Vật & AI"]
    S5 --> S6["Stage 6\nGame Loop & HUD"]
    S6 --> S7["Stage 7\nÂm Thanh & 3 Màn"]
    S7 --> S8["Stage 8\nQA & Deploy Pages"]
```

---

## 📌 STAGE 0: PHÂN TÍCH, THIẾT KẾ KIẾN TRÚC & TÀI LIỆU HÓA (HIỆN TẠI)

- **Mục tiêu**: Thiết lập toàn bộ khung kiến trúc, tài liệu đặc tả, cơ chế gameplay và chỉ dẫn cho AI Agent trước khi viết bất kỳ dòng mã nguồn game nào.
- **Sản phẩm bàn giao**:
  - `README.md`
  - `GEMINI.md`
  - `Agents/PRODUCT_REQUIREMENTS.md`
  - `Agents/GAME_DESIGN_DOCUMENT.md`
  - `Agents/ARCHITECTURE.md`
  - `Agents/IMPLEMENTATION_ROADMAP.md`
  - `Agents/TEST_STRATEGY.md`
  - `Agents/DECISION_LOG.md`
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  1. [x] Toàn bộ 8 tài liệu bắt buộc đã được tạo và viết bằng Tiếng Việt chi tiết, mạch lạc.
  2. [x] Không có bất kỳ tệp mã nguồn game nào (`src/`) được tạo sớm.
  3. [x] Cấu trúc thư mục và trách nhiệm từng mô-đun được phân định rõ ràng.
  4. [x] Lộ trình chi tiết từng Stage có tiêu chí nghiệm thu rõ ràng.
  5. [x] Đã trình bày toàn bộ kết quả để Tech Lead / User xem xét và phê duyệt.

---

## 📌 STAGE 1: KHỞI TẠO HẠ TẦNG DỰ ÁN (SCAFFOLDING & CI/CD PIPELINE)

- **Mục tiêu**: Thiết lập môi trường dự án với Vite, TypeScript, Phaser 3, Vitest và quy trình CI/CD GitHub Actions sẵn sàng cho việc triển khai tự động.
- **Nhiệm vụ cụ thể**:
  - Khởi tạo `package.json` với các dependency: `phaser` (v3.80+), `typescript`, `vite`, `vitest`.
  - Cấu hình `tsconfig.json` với chế độ strict mode.
  - Cấu hình `vite.config.ts` hỗ trợ asset bundling và base path phù hợp với GitHub Pages.
  - Tạo trang `index.html` căn giữa khung canvas màn hình.
  - Tạo tệp `.github/workflows/deploy.yml` tự động build và deploy lên GitHub Pages khi có commit đẩy lên nhánh `main`.
  - Tạo cấu trúc thư mục rỗng chuẩn: `src/config/`, `src/core/`, `src/entities/`, `src/systems/`, `src/scenes/`, `src/ui/`, `src/utils/`, `src/types/`.
  - Thiết lập `BootScene` và `PreloadScene` cơ bản hiển thị màn hình khởi động đen với dòng chữ "BOMBER GAME V1.0".
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  1. Chạy lệnh `npm install` thành công 100%, không xung đột phiên bản.
  2. Lệnh `npm run dev` khởi động dev server mượt mà, mở trình duyệt thấy Canvas hiển thị khung game 720x672.
  3. Lệnh `npm run build` tạo thư mục `dist/` hoàn chỉnh không có cảnh báo kiểu dữ liệu (0 type errors).
  4. File workflow `.github/workflows/deploy.yml` có cú pháp hợp lệ theo chuẩn GitHub Actions.

---

## 📌 STAGE 2: LƯỚI BẢN ĐỒ & DI CHUYỂN NHÂN VẬT MƯỢT MÀ

- **Mục tiêu**: Hiện thực hóa lưới ma trận 15x13, render các khối tường cứng, khối gạch mềm và cơ chế điều khiển nhân vật với hỗ trợ trượt góc (Corner Sliding).
- **Nhiệm vụ cụ thể**:
  - Tạo `GridConfig.ts` và `GridMath.ts` xử lý quy đổi tọa độ Grid `(col, row)` sang Pixel `(x, y)`.
  - Tạo `GridSystem.ts` khởi tạo ma trận 15x13: tường bao quanh, cột trụ chẵn, ô an toàn `(1,1), (1,2), (2,1)`.
  - Sinh ngẫu nhiên gạch mềm trên các ô trống theo cấu hình màn chơi.
  - Vẽ tilemap/sprites cho sàn cỏ, tường đá và gạch mềm (sử dụng vector/canvas graphics hoặc sprite sheet pixel retro).
  - Tạo lớp thực thể `Player.ts`:
    - Nhận phím điều hướng Arrow/WASD.
    - Cấu hình Hitbox kích thước `28x28` căn giữa.
    - Bổ sung thuật toán Corner Sliding khi va chạm góc mép tường.
    - Hoạt ảnh di chuyển 4 hướng (Bước chân đi Lên, Xuống, Trái, Phải).
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  1. Bản đồ hiển thị chính xác theo bố cục chuẩn Bomberman 15x13.
  2. Người chơi di chuyển mượt mà 4 hướng bằng bàn phím.
  3. Nhân vật không thể đi xuyên qua Tường cứng hay Gạch mềm.
  4. Khi đi quẹt vào góc tường, nhân vật tự động trượt vào hành lang mà không bị khựng lại.

---

## 📌 STAGE 3: HỆ THỐNG ĐẶT BOM & VỤ NỔ LAN TRUYỀN (BLAST SYSTEM)

- **Mục tiêu**: Triển khai cơ chế đặt bom, đếm ngược thời gian nổ, hiệu ứng tia lửa nổ 4 hướng chữ thập, phá vỡ gạch mềm và kích hoạt nổ dây chuyền.
- **Nhiệm vụ cụ thể**:
  - Nhấn phím `Space` để thả bom tại tâm ô lưới người chơi đang đứng.
  - Tạo thực thể `Bomb.ts`: đếm ngược 3.0 giây, hoạt ảnh phồng xẹp (pulse animation).
  - Triển khai `BombSystem.ts`:
    - Giới hạn số lượng bom đặt cùng lúc theo chỉ số của Player.
    - Quản lý danh sách các quả bom đang hoạt động.
    - Thuật toán Raycasting tính toán vùng nổ (dừng lại khi gặp Tường cứng, phá hủy Gạch mềm đầu tiên, lan qua ô trống).
    - Phản ứng nổ dây chuyền: quả bom nằm trong tầm nổ của quả bom khác sẽ nổ ngay lập tức.
  - Tạo thực thể `Explosion.ts`:
    - Render tia nổ tại tâm, các đoạn thân (Body segments) và đầu tia nổ (Tip segments).
    - Hitbox nổ tồn tại trong 0.4 giây rồi tự tiêu biến.
  - Xử lý phá vỡ gạch mềm: phát hoạt ảnh vụn vỡ và xóa ô đó trên ma trận lưới.
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  1. Người chơi chỉ đặt được số lượng bom tối đa cho phép.
  2. Bom tự động căn chỉnh ngay ngắn vào tâm ô lưới.
  3. Bom nổ sau 3 giây; tia lửa nổ lan theo 4 hướng hình chữ thập.
  4. Tia lửa không xuyên qua Tường cứng; phá hủy Gạch mềm đầu tiên và chặn lại.
  5. Bom kích nổ quả bom khác ngay tức thì khi bị tia lửa chạm vào.

---

## 📌 STAGE 4: HỆ THỐNG VẬT PHẨM (POWER-UPS) & CỬA THOÁT HIỂM

- **Mục tiêu**: Khi gạch mềm vỡ, sinh ngẫu nhiên vật phẩm tăng sức mạnh hoặc Cửa thoát hiểm; người chơi có thể nhặt và nâng cấp chỉ số.
- **Nhiệm vụ cụ thể**:
  - Tạo `PowerUp.ts` với 3 loại:
    - `Bomb Up`: Tăng số lượng bom tối đa thêm +1.
    - `Fire Up`: Tăng tầm lan truyền tia lửa nổ thêm +1 ô.
    - `Speed Up`: Tăng tốc độ di chuyển của nhân vật thêm +20px/s.
  - Cập nhật `GridSystem.ts`: khi gạch mềm vỡ, 30% tỷ lệ sinh Power-up.
  - Tia lửa bom nếu quét trúng Power-up sẽ phá hủy luôn Power-up đó.
  - Tạo `ExitDoor.ts`:
    - Ẩn dưới một khối gạch mềm duy nhất trong màn chơi.
    - Trạng thái ban đầu: Khóa (Locked).
    - Khi quái vật bị diệt hết: Chuyển sang Mở (Unlocked).
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  1. Phá gạch mềm có tỷ lệ rớt Item chuẩn xác.
  2. Người chơi đi qua nhặt được Item, chỉ số (tầm nổ, số bom, tốc độ) tăng ngay lập tức.
  3. Tia lửa bom thiêu rụi được Item nếu chạm phải.
  4. Cửa thoát hiểm lộ diện khi gạch vỡ và hiển thị đúng trạng thái Đóng/Mở.

---

## 📌 STAGE 5: QUÁI VẬT & TRÍ TUỆ NHÂN TẠO (ENEMY AI)

- **Mục tiêu**: Xây dựng 2 loại quái vật cổ điển (Ballom và Oneal) với logic AI tự hành, va chạm gây sát thương và bị tiêu diệt bởi vụ nổ.
- **Nhiệm vụ cụ thể**:
  - Tạo lớp cơ sở `Enemy.ts` kế thừa Sprite có thanh máu/trạng thái.
  - Tạo `Ballom.ts`:
    - Tốc độ chậm (60 px/s).
    - AI: Di chuyển thẳng cho đến khi gặp tường/gạch/bom thì chọn hướng ngẫu nhiên tại ngã rẽ.
  - Tạo `Oneal.ts`:
    - Tốc độ bình thường (95 px/s).
    - AI: Quét đường ngắm trực giao (Line of Sight); nếu thấy Player trong khoảng cách 4 ô mà không có vật cản thì tăng tốc lao tới.
  - Triển khai `CollisionSystem.ts`:
    - Quái vật chạm trúng Player -> Player mất 1 mạng, phát hoạt ảnh tử nạn.
    - Tia lửa bom chạm trúng Quái vật -> Quái vật chết, phát hoạt ảnh biến mất và cộng điểm.
    - Khi quái vật cuối cùng chết -> Phát sự kiện `ALL_ENEMIES_DEFEATED` để mở Cửa thoát hiểm.
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  1. Quái vật Ballom tuần tra tự động, đổi hướng hợp lý khi chạm vật cản.
  2. Quái vật Oneal kích hoạt trạng thái săn lùng khi nhìn thấy Player.
  3. Quái vật bị tiêu diệt khi trúng tia nổ của bom.
  4. Người chơi mất mạng khi chạm vào quái vật.
  5. Cửa thoát hiểm mở ra ngay sau khi con quái cuối cùng bị tiêu diệt.

---

## 📌 STAGE 6: VÒNG LẶP TRÒ CHƠI, GIAO DIỆN HUD & QUY TẮC THẮNG/THUA

- **Mục tiêu**: Hoàn thiện toàn bộ vòng lặp trò chơi từ Menu, HUD hiển thị trực quan (Điểm, Mạng, Thời gian), Pause, Game Over và Victory.
- **Nhiệm vụ cụ thể**:
  - Xây dựng `UIScene.ts` chạy đè song song với `GameScene`:
    - Hiển thị HUD trên cùng: Điểm số, Thời gian đếm ngược (đếm lùi từ 200s), Số mạng (Icons trái tim).
  - Xây dựng `ScoreSystem.ts`:
    - Quản lý điểm số, trừ mạng khi chết, tính điểm thưởng thời gian khi thắng.
    - Quản lý lưu trữ Kỷ lục (High Score) vào `localStorage`.
  - Màn hình `MenuScene`: Nút Bắt đầu chơi, Hướng dẫn phím bấm, Điểm cao nhất.
  - Cửa sổ Tạm dừng (`PauseModal`): Phím `P` hoặc `ESC` để dừng/tiếp tục.
  - Màn hình Kết thúc (`GameOverScene` & `VictoryScene`): Hiển thị tổng kết điểm và nút Chơi lại.
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  1. HUD hiển thị chính xác và cập nhật theo thời gian thực (Real-time).
  2. Hết thời gian hoặc hết mạng dẫn đến Game Over chuẩn xác.
  3. Vào Cửa mở dẫn đến màn hình Chiến thắng và tính điểm thưởng.
  4. Tạm dừng game hoạt động hoàn hảo, không bị trôi thời gian hay chuyển động vật lý.
  5. Kỷ lục điểm số được lưu trữ bền vững qua các lần tải lại trang.

---

## 📌 STAGE 7: ÂM THANH, HIỆU ỨNG HÌNH ẢNH (POLISH) & 3 MÀN CHƠI

- **Mục tiêu**: Tích hợp toàn bộ âm thanh retro (SFX & BGM), hiệu ứng hạt (Particle effects), rung màn hình khi nổ bom và luân chuyển qua 3 màn chơi có độ khó tăng dần.
- **Nhiệm vụ cụ thể**:
  - Triển khai `AudioSystem.ts`:
    - Quản lý bật/tắt tiếng (Mute toggle).
    - Phát âm thanh nổ bom, đặt bom, nhặt item, quái chết, người chết, nhạc nền BGM.
  - Thêm hiệu ứng hình ảnh (VFX):
    - Hạt bụi khi gạch mềm vỡ vụn.
    - Rung màn hình nhẹ (Camera Shake) khi bom phát nổ gần người chơi.
    - Hoạt ảnh chữ "STAGE CLEAR" / "HURRY UP" khi thời gian còn dưới 30 giây.
  - Thiết lập luồng chuyển tiếp 3 màn chơi (Stage 1 -> Stage 2 -> Stage 3):
    - Tăng số lượng gạch mềm và bổ sung quái Oneal theo đúng bảng thiết kế GDD.
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  1. Mọi hành động chính (đặt bom, nổ, nhặt đồ, chết, thắng) đều có âm thanh tương ứng sống động.
  2. Nút tắt/bật âm thanh hoạt động chuẩn trên thanh HUD.
  3. Hoàn thành Stage 1 tự động chuyển sang Stage 2 với cấu hình độ khó tăng lên.
  4. Vượt qua Stage 3 sẽ hiển thị màn hình Phá Đảo (Game Cleared).

---

## 📌 STAGE 8: KIỂM THỬ TOÀN DIỆN, ĐẢM BẢO CHẤT LƯỢNG & PHÁT HÀNH GITHUB PAGES

- **Mục tiêu**: Viết bộ Unit Test kiểm tra logic toán học/ma trận, kiểm thử thủ công tất cả các trường hợp biên, tối ưu hiệu năng và phát hành chính thức lên GitHub Pages.
- **Nhiệm vụ cụ thể**:
  - Viết Unit Tests (Vitest) cho:
    - Quy đổi tọa độ `GridMath` (WorldToGrid, GridToWorld).
    - Thuật toán Raycasting vụ nổ bom (chặn tường cứng, phá gạch mềm).
    - Tính điểm thưởng và máy trạng thái vòng đời.
  - Thực hiện Manual Test Checklist theo tài liệu `TEST_STRATEGY.md`.
  - Tối ưu hóa bundle và tài nguyên: Đảm bảo FPS đạt 60, không bị memory leak khi chơi lại nhiều lần.
  - Đẩy mã nguồn lên GitHub, kích hoạt GitHub Actions workflow và xác thực game chạy hoàn hảo trên URL GitHub Pages công khai.
- **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  1. 100% Unit Tests đều Pass (`npm run test`).
  2. Không có bất kỳ cảnh báo hoặc lỗi TypeScript (`npm run typecheck`).
  3. Game chạy mượt mà 60 FPS trên Chrome, Firefox, Safari và Edge.
  4. Đường link GitHub Pages hoạt động trơn tru cho người dùng trải nghiệm thực tế.
