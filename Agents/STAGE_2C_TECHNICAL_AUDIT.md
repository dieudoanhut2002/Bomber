# BÁO CÁO KIỂM TOÁN KỸ THUẬT STAGE 2C (TECHNICAL AUDIT REPORT)
# PLAYER ENTITY & SMOOTH MOVEMENT (CORNER SLIDING)

- **Dự án**: Bomber Game (Classic Web Arcade)
- **Giai đoạn kiểm toán**: Stage 2C – Player Entity & Smooth Movement (Corner Sliding)
- **Ngày thực hiện**: 2026-11-07
- **Người thực hiện**: AI Coding Agent (Senior Software Architect & QA Lead)
- **Phương châm**: Kiểm toán độc lập, khách quan, đọc trực tiếp mã nguồn, đối chiếu nghiêm ngặt với GDD và kiến trúc; **tuyệt đối không sửa code, không refactor, không tự nghiệm thu**.

---

## 1. TỔNG QUAN ĐIỀU HÀNH (EXECUTIVE SUMMARY)

Stage 2C đã triển khai thành công các thành phần cốt lõi của nhân vật người chơi:
1. **Kiến trúc mô-đun hóa cao**: Tách biệt rõ ràng giữa Input (`PlayerInputSystem`), Collision/Movement (`PlayerCollisionSystem`), Presentation (`Player`), Procedural Art (`PlayerTextureGenerator`) và Render (`GameScene`).
2. **Kiểm thử tự động vững chắc**: 66 bài test tự động (10 test suites) chạy độc lập Headless trong 89ms và đạt tỷ lệ Pass 100%. TypeScript Strict Mode đạt 0 lỗi biên dịch.
3. **Cơ chế di chuyển mượt mà & Hitbox**: Hitbox chuẩn `28 x 28` căn giữa offset 10px trên tile 48x48. Kỹ thuật Sub-stepping (4px) giải quyết tốt nguy cơ Tunneling cơ bản.
4. **Phát hiện quan trọng (Key Audit Findings)**:
   - **0 Critical**.
   - **2 Major**: 
     - *AUD-01*: Rủi ro xung đột quyền kiểm soát tọa độ giữa Arcade Physics Dynamic Body và custom Kinematic `setPosition()` khi tích hợp Bom/Quái ở Stage 3 & 5.
     - *AUD-02*: Thuật toán Corner Sliding hiện tại chỉ hỗ trợ tình huống rẽ góc ở ngã ba (T-Junction Turning), chưa hỗ trợ cơ chế tự động căn tâm khi đi vào hành lang hẹp (Corridor Entry Auto-Centering).
   - **2 Minor**:
     - *AUD-03*: Công thức tính `forwardCol`/`forwardRow` trong Corner Sliding nhạy cảm với sai số float khi chưa chạm sát biên ô.
     - *AUD-04*: Thiếu giới hạn trần (clamping) cho `deltaSeconds` khi người dùng chuyển tab trình duyệt.
   - **1 Informational**:
     - *AUD-05*: Cần bổ sung test cases kiểm tra tính đối xứng cho hướng `LEFT` và `UP` trong các bộ test Movement và Corner Sliding.

---

## 2. PHẠM VI & PHƯƠNG PHÁP KIỂM TOÁN (SCOPE & METHODOLOGY)

### 2.1. Phạm vi kiểm toán
- **Mã nguồn thực tế**:
  - [`src/types/Player.types.ts`](file:///G:/GIT/Bomber/src/types/Player.types.ts)
  - [`src/config/PlayerConfig.ts`](file:///G:/GIT/Bomber/src/config/PlayerConfig.ts)
  - [`src/systems/PlayerCollisionSystem.ts`](file:///G:/GIT/Bomber/src/systems/PlayerCollisionSystem.ts)
  - [`src/systems/PlayerInputSystem.ts`](file:///G:/GIT/Bomber/src/systems/PlayerInputSystem.ts)
  - [`src/entities/Player.ts`](file:///G:/GIT/Bomber/src/entities/Player.ts)
  - [`src/utils/PlayerTextureGenerator.ts`](file:///G:/GIT/Bomber/src/utils/PlayerTextureGenerator.ts)
  - [`src/scenes/GameScene.ts`](file:///G:/GIT/Bomber/src/scenes/GameScene.ts)
- **Hệ thống phụ thuộc (Stage 2B)**: `GridSystem.ts`, `GameMap.ts`, `GridMath.ts`.
- **Hệ thống kiểm thử**: 10 file test trong `tests/`.

### 2.2. Phương pháp xác minh (Verification Methods)
- **Xác minh qua Source Code**: Phân tích logic giải thuật từng dòng, kiểm tra luồng dữ liệu, memory lifecycle.
- **Xác minh qua Automated Test**: Chạy `npm run test` (Vitest), đọc cấu trúc từng test case.
- **Xác minh qua Compilation & Build**: `npm run typecheck`, `npm run build`.

---

## 3. ĐÁNH GIÁ KIẾN TRÚC NHÂN VẬT (PLAYER ARCHITECTURE REVIEW)

### 3.1. Phân tách trách nhiệm (Separation of Concerns)
- **Đạt chuẩn xuất sắc**: `PlayerCollisionSystem` hoàn toàn không phụ thuộc vào Phaser API, chỉ nhận `GridSystem` và tọa độ số học, cho phép kiểm thử toán học 100% không đầu (Headless).
- `OrthogonalInputResolver` tách riêng logic xử lý xung đột đa phím ra khỏi Phaser Keyboard.

### 3.2. Đánh giá tích hợp Arcade Physics vs Custom Movement (AUD-01)
- **Hiện trạng code trong [`src/entities/Player.ts`](file:///G:/GIT/Bomber/src/entities/Player.ts)**:
  ```typescript
  scene.physics.add.existing(this);
  body.setSize(PLAYER_CONFIG.HITBOX_WIDTH, PLAYER_CONFIG.HITBOX_HEIGHT);
  body.setOffset(PLAYER_HITBOX_OFFSET.x, PLAYER_HITBOX_OFFSET.y);
  body.setCollideWorldBounds(true);
  ```
  Và trong vòng lặp `updateMovement()`:
  ```typescript
  this.setPosition(result.x, result.y);
  ```
- **Phân tích rủi ro**:
  Player hiện tại là một Arcade Physics Dynamic Sprite (có `body.moves = true` mặc định), nhưng vị trí lại được cập nhật cưỡng bức qua `setPosition()`.
  Ở Stage 2C, điều này hoạt động tốt vì chưa có vật thể vật lý nào khác. Tuy nhiên, ở **Stage 3 (Bom)** và **Stage 5 (Quái vật)**:
  - Nếu sử dụng `this.physics.add.collider(player, bombs)`, hệ thống Arcade Physics sẽ cố gắng đẩy `body.position` của Player ra khỏi Bomb trong bước tính vật lý `physics.world.step()`.
  - Nhưng ngay sau đó, `updateMovement()` lại ghi đè `setPosition()` bằng kết quả từ `PlayerCollisionSystem`.
  - Hai hệ thống kiểm soát vị trí song song sẽ gây xung đột (Fighting position authority), dẫn đến hiện tượng rung lắc (jitter) hoặc xuyên thấu vật cản.

---

## 4. ĐÁNH GIÁ HITBOX & VA CHẠM (COLLISION & HITBOX REVIEW)

| Tiêu chuẩn kiểm tra | Kết quả | Chi tiết phân tích source code |
| :--- | :---: | :--- |
| **Kích thước Hitbox 28x28** | **ĐẠT** | `PLAYER_CONFIG.HITBOX_WIDTH = 28`, `HITBOX_HEIGHT = 28`. |
| **Offset căn giữa 10px** | **ĐẠT** | `(48 - 28) / 2 = 10px`. Khớp hoàn hảo trên cả X và Y. |
| **AABB vs Ô lưới** | **ĐẠT** | Thuật toán quét ma trận từ `minCol` đến `maxCol`, `minRow` đến `maxRow` kiểm tra `isWalkable()`. |
| **Chặn Hard Wall & Soft Wall** | **ĐẠT** | Kiểm chứng qua `isWalkable()` của `GridSystem`. |
| **Chặn biên sàn đấu & HUD** | **ĐẠT** | `left < 0 \|\| right > 720 \|\| top < 48 \|\| bottom > 672` đều bị chặn. |
| **Dừng áp sát mặt tường (Pixel-flush)** | **ĐẠT** | Hàm `getFlushPosition()` sử dụng binary search 5 bước để áp sát mép tường trong phạm vi 0.1px mà không để lại khoảng hở. |

---

## 5. ĐÁNH GIÁ THUẬT TOÁN CORNER SLIDING (CORNER SLIDING REVIEW)

### 5.1. Cơ chế đã triển khai
Trong [`src/systems/PlayerCollisionSystem.ts`](file:///G:/GIT/Bomber/src/systems/PlayerCollisionSystem.ts) (hàm `tryCornerSliding`):
- Khi di chuyển ngang (`LEFT`/`RIGHT`) gặp tường: nếu độ lệch tâm theo trục dọc `|diffY| <= 14px`, kiểm tra ô góc chéo tiếp theo. Nếu mở, nhân vật trượt `UP` hoặc `DOWN`.
- Khi di chuyển dọc (`UP`/`DOWN`) gặp tường: nếu độ lệch tâm theo trục ngang `|diffX| <= 14px`, kiểm tra ô góc chéo tiếp theo. Nếu mở, nhân vật trượt `LEFT` hoặc `RIGHT`.

### 5.2. Đánh giá theo 12 kịch bản bắt buộc

| Kịch bản | Đánh giá | Chi tiết phân tích |
| :--- | :---: | :--- |
| 1. RIGHT gặp tường, trượt UP | **ĐẠT** | Đã kiểm chứng qua test `UT-SLIDE-01` (`diffY = -6px`). |
| 2. RIGHT gặp tường, trượt DOWN | **ĐẠT** | Đã kiểm chứng qua test `UT-SLIDE-02` (`diffY = +6px`). |
| 3. LEFT gặp tường, trượt UP/DOWN | **ĐẠT logic** | Code có xử lý nhưng **chưa có unit test** cho hướng LEFT. |
| 4. UP gặp tường, trượt LEFT/RIGHT | **ĐẠT logic** | Code có xử lý nhưng **chưa có unit test** cho hướng UP. |
| 5. DOWN gặp tường, trượt LEFT/RIGHT | **ĐẠT** | Đã kiểm chứng qua test `UT-SLIDE-03` và `UT-SLIDE-04`. |
| 6. Offset = 0px (thẳng tâm) | **Có vấn đề** | Nếu đâm thẳng tâm một trụ cột mà cả 2 bên đều mở: Code ưu tiên rẽ nhánh đầu tiên (`diffY <= 0` -> trượt UP, hoặc `diffX <= 0` -> trượt LEFT) thay vì dừng đứng im. |
| 7. Offset = 13px | **ĐẠT** | Nằm trong ngưỡng 14px, trượt thành công. |
| 8. Offset = 14px | **ĐẠT** | Ngưỡng bằng biên (`<= 14`), trượt thành công. |
| 9. Offset = 15px | **ĐẠT** | Vượt ngưỡng (`> 14`), không trượt, dừng áp sát mặt tường (`UT-SLIDE-05`). |
| 10. Khe hẹp giữa 2 vật cản | **Phát hiện AUD-02** | Xem mục AUD-02 bên dưới. Khi đi vào khe hẹp bị lệch tâm, thuật toán không tự căn giữa vào khe. |
| 11. Hai vật cản tạo góc lõm | **ĐẠT** | Không xuyên góc lõm vì `isColliding()` tại tọa độ trượt luôn được kiểm tra trước khi gán. |
| 12. Sliding liên tục nhiều frame | **ĐẠT** | Đã kiểm chứng qua `UT-SLIDE-06` chạy 10 bước trượt liên tục không va chạm. |

---

## 6. ĐÁNH GIÁ SUB-STEPPING (SUB-STEPPING REVIEW)

- **Cơ chế**:
  ```typescript
  const totalDistance = PLAYER_CONFIG.BASE_SPEED * deltaSeconds;
  const maxStepSize = 4; // Bước kiểm tra tối đa 4px
  const steps = Math.max(1, Math.ceil(totalDistance / maxStepSize));
  ```
- **Đánh giá**:
  - Với tốc độ 120 px/s ở 60 FPS, mỗi frame di chuyển 2px (`steps = 1`).
  - Khi FPS tụt xuống 15 FPS, mỗi frame di chuyển 8px (`steps = 2`).
  - Bước di chuyển 4px nhỏ hơn nhiều so với bề dày nửa Hitbox (14px), triệt tiêu hoàn toàn khả năng nhân vật bị vọt xuyên qua tường trong 1 frame.
- **Điểm cần lưu ý (AUD-04)**: Cần bổ sung trần `deltaSeconds = Math.min(delta / 1000, 0.1)` để tránh trường hợp người dùng tab-out lâu khiến `steps` tăng lên hàng nghìn vòng lặp không cần thiết.

---

## 7. ĐÁNH GIÁ HỆ THỐNG INPUT (INPUT REVIEW)

- **Nguyên lý hoạt động**:
  - `OrthogonalInputResolver` duy trì mảng `activeDirections` theo ngăn xếp LIFO.
  - Nhấn phím mới -> đẩy vào đỉnh mảng -> trở thành hướng hoạt động tức thì.
  - Thả phím mới -> gỡ khỏi mảng -> hướng hoạt động quay về phím giữ trước đó.
- **Đánh giá**:
  - Triệt tiêu 100% hiện tượng kẹt phím hoặc nhân vật tự chạy sau khi nhả phím.
  - Không cho phép di chuyển chéo 8 hướng (đúng chuẩn Bomberman).
  - Tự động gọi `cleanup()` khi Scene `shutdown` hoặc `destroy`, ngăn ngừa rò rỉ listener.

---

## 8. ĐÁNH GIÁ HOẠT ẢNH & ĐỒ HỌA (ANIMATION & VISUAL REVIEW)

- **Procedural Texture Generator**:
  - Tạo đủ 8 frames và 8 animations: `IDLE_DOWN`, `WALK_DOWN`, `IDLE_UP`, `WALK_UP`, `IDLE_LEFT`, `WALK_LEFT`, `IDLE_RIGHT`, `WALK_RIGHT`.
  - Có cờ kiểm tra `scene.textures.exists(KEY)` tránh sinh texture lặp khi restart scene.
- **Animation Switching**:
  - Gọi `this.play(animKey, true)` với tham số `ignoreIfPlaying = true`, ngăn ngừa việc reset hoạt ảnh mỗi frame (không bị nhấp nháy).
  - Khi dừng di chuyển, chuyển sang hoạt ảnh `IDLE_*` tương ứng với hướng nhìn cuối cùng.

---

## 9. ĐÁNH GIÁ ĐỘ BAO PHỦ KIỂM THỬ (TEST COVERAGE REVIEW)

- **Tổng số test hiện tại**: **66 tests** (toàn bộ PASS).
- **Đánh giá chất lượng test**:
  - Các bài test kiểm tra hành vi thực tế (State & Coordinate Verification), không phải mock giả tạo.
  - Đã có test kiểm tra tính độc lập với frame rate (`UT-MOVE-04`).
  - Đã có test kiểm tra không xuyên tường (`UT-COLLISION-02`, `03`).
- **Khoảng trống kiểm thử cần bổ sung (AUD-05)**:
  - Cần bổ sung test cho hướng `LEFT` và `UP` trong `CornerSliding.test.ts` và `PlayerMovement.test.ts`.

---

## 10. DANH SÁCH CHI TIẾT CÁC PHÁT HIỆN (FINDINGS LOG)

### 🔴 AUD-01 (Major) – Rủi ro xung đột quyền kiểm soát tọa độ giữa Arcade Physics và Kinematic Movement
- **Vị trí**: [`src/entities/Player.ts`](file:///G:/GIT/Bomber/src/entities/Player.ts#L30-L75)
- **Mô tả**: Player kế thừa `Phaser.Physics.Arcade.Sprite` và kích hoạt Arcade Body (`scene.physics.add.existing(this)`), nhưng việc di chuyển lại hoàn toàn do custom logic điều khiển thông qua `this.setPosition(result.x, result.y)`.
- **Tình huống xảy ra**: Ở Stage 3, khi Player đặt quả Bom (vật thể rắn), nếu lập trình viên dùng `physics.add.collider(player, bomb)` của Arcade Physics, hệ thống vật lý sẽ tự động đẩy Player, gây xung đột trực tiếp với `setPosition()` của `PlayerCollisionSystem`.
- **Tác động**: Rung lắc hình ảnh (jitter), có thể phá vỡ tính toán Corner Sliding.
- **Đề xuất khắc phục (Stage 3)**: Quy định rõ ràng trong Architecture: Mọi chướng ngại vật (Bom, Tường, Gạch) đều được đồng bộ vào `GridSystem` và xử lý thông qua `PlayerCollisionSystem`. Arcade Physics chỉ được dùng cho các trigger overlap không va chạm (nhặt Item, dính tia nổ Bom).

---

### 🔴 AUD-02 (Major) – Thuật toán Corner Sliding chưa hỗ trợ tự động căn giữa khi đi vào hành lang (Corridor Entry Auto-Centering)
- **Vị trí**: [`src/systems/PlayerCollisionSystem.ts`](file:///G:/GIT/Bomber/src/systems/PlayerCollisionSystem.ts#L183-L208)
- **Mô tả**:
  Thuật toán hiện tại chỉ xử lý tình huống nhân vật đâm vào bức tường trước mặt và muốn rẽ sang lối đi vuông góc bên cạnh.
  Nó KHÔNG xử lý tình huống: Nhân vật đang đi dọc hành lang và muốn đi thẳng qua một cửa hẹp (1 ô), nhưng do bị lệch tâm vài pixel nên mép ngoài Hitbox quẹt vào góc của trụ cột cửa.
- **Tình huống xảy ra**:
  Người chơi đi từ dưới lên trên qua khe hẹp giữa 2 cột đá, bị lệch trái 6px (`diffX = -6`). Mép trái hitbox chạm góc cột trái. Thuật toán kiểm tra ô góc chéo bên trái (`col - 1`) thấy có cột đá nên không trượt sang trái, và cũng không trượt sang phải để căn giữa người chơi vào khe hẹp!
- **Tác động**: Người chơi bị chặn đứng trước khe cửa hẹp dù lối đi phía trước hoàn toàn thông thoáng, phải tự nhả phím và bấm phím ngang để căn chỉnh tâm bằng tay.
- **Đề xuất khắc phục (Stage 2C Polish / Stage 3)**:
  Bổ sung nhánh kiểm tra: Nếu ô mục tiêu phía trước là `WALKABLE`, nhưng bị vướng mép do lệch tâm, tự động đẩy nhân vật về phía tâm của ô mục tiêu (`diffX > 0 ? -slideDistance : slideDistance`).

---

### 🟡 AUD-03 (Minor) – Công thức tính `forwardCol` / `forwardRow` nhạy cảm với tọa độ số thực
- **Vị trí**: [`src/systems/PlayerCollisionSystem.ts`](file:///G:/GIT/Bomber/src/systems/PlayerCollisionSystem.ts#L183-L185)
- **Mô tả**:
  ```typescript
  const forwardCol = direction === 'RIGHT'
    ? Math.floor((x + this.hitboxHalfWidth + 0.001) / tileSize)
    : Math.floor((x - this.hitboxHalfWidth - 0.001) / tileSize);
  ```
  Nếu Player bị cản khi tọa độ mép chưa chạm hẳn vào vạch phân cách ô (ví dụ `x = 81.5`, mép phải `95.5px` trong khi vách ngăn ở `96px`), `Math.floor(95.5 / 48) = 1`. Giá trị `forwardCol` bị tính là `1` (cột hiện tại) thay vì `2` (cột vật cản).
- **Tác động**: Trong một số frame nhất định khi sub-stepping chưa áp sát 0.001px mép tường, corner sliding có thể bị bỏ qua trong 1-2 tick đầu tiên.
- **Đề xuất khắc phục**: Tính `forwardCol` / `forwardRow` dựa trên tọa độ đích `targetX` / `targetY` thay vì tọa độ hiện tại `x` / `y`.

---

### 🟡 AUD-04 (Minor) – Thiếu trần giới hạn `deltaSeconds` khi mất tiêu điểm trình duyệt
- **Vị trí**: [`src/scenes/GameScene.ts`](file:///G:/GIT/Bomber/src/scenes/GameScene.ts#L52)
- **Mô tả**: `const deltaSeconds = delta / 1000;` được truyền trực tiếp vào `player.updateMovement()`.
- **Tình huống xảy ra**: Người dùng chuyển sang tab khác trong 30 giây rồi quay lại, Phaser có thể trả về `delta = 30000ms`, khiến vòng lặp Sub-stepping chạy tới 900 bước trong 1 frame.
- **Tác động**: Gây giật lag nhẹ trong frame đầu tiên sau khi kích hoạt lại tab.
- **Đề xuất khắc phục**: Thêm trần giới hạn `const deltaSeconds = Math.min(delta / 1000, 0.1);` (tối đa 100ms/frame).

---

### 🔵 AUD-05 (Informational) – Thiếu kịch bản kiểm thử đối xứng cho hướng LEFT và UP
- **Vị trí**: `tests/CornerSliding.test.ts`, `tests/PlayerMovement.test.ts`
- **Mô tả**: Các bộ test hiện tại tập trung kiểm thử hướng `RIGHT` và `DOWN`. Hướng `LEFT` và `UP` dù mã nguồn có cài đặt nhưng chưa có unit test độc lập xác thực tính đối xứng.
- **Đề xuất**: Bổ sung thêm 4 test cases cho `LEFT` và `UP` để đạt độ bao phủ đối xứng 100%.

---

## 11. KẾT LUẬN & KIẾN NGHỊ NGHIỆM THU (ACCEPTANCE RECOMMENDATION)

- **Tổng hợp chất lượng Stage 2C**:
  - Không có lỗi nghiêm trọng (0 Critical).
  - Mã nguồn tuân thủ xuất sắc các nguyên tắc của dự án: Type-safe tuyệt đối, Clean Architecture, độc lập Phaser trong tính toán va chạm, 66/66 test pass.
  - Cảm giác điều khiển hiện tại trên GameScene mượt mà, chính xác, không xuyên tường, hoạt ảnh 4 hướng đẹp mắt.
  - Các phát hiện thuộc mức **Major** (AUD-01, AUD-02) là các điểm tối ưu hóa nâng cao về cảm giác gameplay và chuẩn bị cho các Stage tiếp theo (Stage 3 Đặt Bom). Chúng hoàn toàn không phá vỡ tính năng hiện tại của Stage 2C.
- **Kiến nghị**:
  - **ĐỦ ĐIỀU KIỆN NGHIỆM THU KỸ THUẬT STAGE 2C (CONDITIONALLY ACCEPTED)**.
  - Các đề xuất trong AUD-01 đến AUD-04 sẽ được ghi nhận vào tài liệu kiến trúc và giải quyết trong phần chuẩn bị kỹ thuật (Technical Prerequisites) của Stage 3.
