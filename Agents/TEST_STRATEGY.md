# CHIẾN LƯỢC KIỂM THỬ TRÒ CHƠI (TEST STRATEGY SPECIFICATION)

---

## 1. NGUYÊN TẮC KIỂM THỬ (TESTING PHILOSOPHY)

Để đảm bảo tựa game vận hành ổn định, không có lỗi tiềm ẩn và duy trì trải nghiệm người chơi mượt mà nhất, dự án áp dụng chiến lược **Tách biệt Logic khỏi Render (Headless Logic Separation)**:
- **Tầng logic thuần túy (Pure Logic Layer)**: Các thuật toán chuyển đổi tọa độ, ma trận lưới, phân rã vụ nổ (Blast Raycasting) và tính điểm được thiết kế độc lập hoàn toàn với Phaser API. Nhờ đó, chúng có thể được kiểm thử tự động (Unit Test) siêu tốc bằng **Vitest** mà không cần khởi tạo trình duyệt hoặc Canvas WebGL.
- **Tầng trải nghiệm người chơi (Gameplay & Feel)**: Kiểm thử thủ công thông qua danh mục kịch bản biên (Edge Cases Checklist) để đảm bảo độ mượt của chuyển động và độ nhạy của phím bấm.

---

## 2. KIM TỰ THÁP KIỂM THỬ (TESTING PYRAMID)

```text
               ▲
              / \
             /   \      Kiểm thử Thủ công & Cảm giác chơi
            / E2E \     (Manual & Gameplay Feel Testing - 15%)
           /-------\
          /         \   Kiểm thử Tích hợp luồng sự kiện
         / Integrat. \  (Integration & EventBus Tests - 25%)
        /-------------\
       /               \ Kiểm thử Đơn vị thuật toán lõi
      /   Unit Tests    \(Unit Tests with Vitest - 60%)
     /───────────────────\
```

---

## 3. DANH MỤC KIỂM THỬ ĐƠN VỊ TỰ ĐỘNG (UNIT TESTS WITH VITEST)

### 3.1. Kiểm thử chuyển đổi tọa độ (`GridMath.test.ts`)
| ID | Kịch bản kiểm thử | Dữ liệu đầu vào | Kỳ vọng đầu ra |
| :--- | :--- | :--- | :--- |
| `UT-MATH-01` | Chuyển đổi từ Pixel sang Ô Lưới | `(x: 72, y: 72)` | `{ col: 1, row: 1 }` (với Tile 48x48) |
| `UT-MATH-02` | Chuyển đổi từ Ô Lưới sang Pixel tâm ô | `{ col: 2, row: 3 }` | `(x: 120, y: 168)` |
| `UT-MATH-03` | Xử lý tọa độ nằm ngoài biên | `(x: -10, y: 9999)` | Báo tọa độ không hợp lệ (`isValid = false`) |

### 3.2. Kiểm thử ma trận bản đồ (`GridSystem.test.ts` & `GameMap.test.ts`)
| ID | Tệp kiểm thử | Mô tả kiểm tra |
| :--- | :--- | :--- |
| `UT-MAP-01 -> 05` | `GameMap.test.ts` | Kiểm tra đóng gói dữ liệu bản đồ, tính bất biến khi khởi tạo và trích xuất (`cloneTiles`), serialization `toData()` và `fromData()`. |
| `UT-GRID-01 -> 06` | `GridSystem.test.ts` | Kích thước 15x13, truy xuất tọa độ hợp lệ, xử lý tọa độ âm/ngoài biên trả về `null`, cập nhật Tile hợp lệ và từ chối cập nhật ngoài biên. |
| `UT-GRID-07 -> 08` | `GridSystem.test.ts` | Kiểm tra tính năng `isWalkable()` và `isDestructible()` cho từng loại Tile. |
| `UT-GRID-09 -> 11` | `GridSystem.test.ts` | `destroySoftWall()` chuyển gạch mềm thành EMPTY, lộ diện Cửa Thoát Hiểm tại `exitCoord`, mở khóa cửa, và bảo vệ `getTilesSnapshot()`. |

### 3.3. Kiểm thử thuật toán sinh bản đồ tất định (`MapGenerator.test.ts`)
| ID | Kịch bản kiểm thử | Mô tả và kỳ vọng |
| :--- | :--- | :--- |
| `UT-MAPGEN-01 -> 03` | Kích thước & Tính tất định (Deterministic) | Ma trận 15x13. Cùng Seed sinh ra bản đồ giống hệt 100%. Khác Seed sinh ra bố cục khác nhau. |
| `UT-MAPGEN-04 -> 05` | Tường bao & Trụ cột cố định | 100% tường bao là `HARD_WALL`. Mọi ô `col % 2 == 0 && row % 2 == 0` là `HARD_WALL`. |
| `UT-MAPGEN-06` | Vùng an toàn của Player | Vùng xuất phát (1,1), (1,2), (2,1) luôn là `EMPTY` với mọi seed. |
| `UT-MAPGEN-07 -> 08` | Số lượng gạch & Cửa thoát hiểm | Stage 1 = 30, Stage 2 = 42, Stage 3 = 50 gạch mềm. Vị trí Cửa Thoát Hiểm nằm ẩn dưới 1 khối gạch mềm. |

### 3.4. Kiểm thử hệ thống điều khiển & va chạm nhân vật (Player, Movement, Hitbox, Collision & Sliding - Stage 2C & Stage 2C.1)
| ID | Tệp kiểm thử | Mô tả và kỳ vọng |
| :--- | :--- | :--- |
| `UT-INPUT-01 -> 08` | `PlayerInput.test.ts` | 4 hướng Arrow Keys & WASD tương đương, không tăng tốc khi nhấn đúp cùng hướng, Last-Pressed Priority cho 2 phím vuông góc, reset input an toàn. |
| `UT-HITBOX-01 -> 04` | `PlayerHitbox.test.ts` | Hitbox 28x28 căn giữa trên sprite 48x48 (offset 10px), tính toán AABB chính xác quanh tâm, di chuyển đồng bộ với Player. |
| `UT-MOVE-01 -> 08` | `PlayerMovement.test.ts` | Di chuyển đúng hướng với vận tốc 120 px/s (đủ 4 hướng RIGHT, DOWN, LEFT, UP), đứng yên khi NONE/dt<=0, nhất quán không phụ thuộc frame rate, không phát sinh NaN/Infinity, Delta-time clamping ngăn chặn lag spike khi delta cực lớn (10.0s bị clamp còn 0.1s). |
| `UT-COLLISION-01 -> 06` | `PlayerCollision.test.ts` | Đi lại tự do trên EMPTY, chặn đứng không xuyên HARD_WALL và SOFT_BRICK theo cả 4 hướng (RIGHT, DOWN, LEFT, UP), áp sát mép (pixel-flush), chặn vượt biên World Bounds / HUD. |
| `UT-SLIDE-01 -> 17` | `CornerSliding.test.ts` | **Hai cơ chế trượt góc toàn diện (ADR-012)**:<br>1. *T-Junction Corner Rounding* (`01-06`, `13-16`): Trượt LÊN/XUỐNG khi đâm vào cạnh ngang, trượt TRÁI/PHẢI khi đâm vào cạnh dọc (cho cả 4 hướng RIGHT, LEFT, DOWN, UP).<br>2. *Corridor Entry Auto-Centering* (`07-11`): Tự động căn giữa khi đi vào hành lang 1 ô mở nhưng bị lệch tâm lấn vào tường bên cạnh.<br>3. *Không trượt khi ngõ cụt* (`12`).<br>4. *Kiểm tra ngưỡng biên* (`17`): Lệch đúng 14px kích hoạt trượt, lệch 15px không kích hoạt trượt. |

### 3.5. Kiểm thử hạ tầng sự kiện an toàn (`EventBus.test.ts`)
| ID | Kịch bản kiểm thử | Mô tả và kỳ vọng |
| :--- | :--- | :--- |
| `UT-EVENT-01 -> 03` | Type-Safe Event Emission | Ràng buộc kiểu dữ liệu payload cho sự kiện có payload và void. Kiểm tra `once()` chỉ chạy 1 lần. |
| `UT-EVENT-04` | Tự động dọn dẹp theo vòng đời Scene | Khi Scene phát sự kiện `shutdown`, listener tự động hủy đăng ký, triệt tiêu memory leak. |

### 3.6. Kiểm thử phân hệ Bom cốt lõi (`BombSystem.test.ts` - Stage 3B.1, ADR-013)
| ID | Kịch bản kiểm thử | Mô tả và kỳ vọng |
| :--- | :--- | :--- |
| `UT-BOMB-01 -> 08` | Khởi tạo & Đặt bom | Đặt bom hợp lệ tại ô trống (`ARMED`), gán ownerId, gridCoord chuẩn, từ chối trùng cell, từ chối vượt capacity, từ chối blastPower / fuseDuration không hợp lệ, từ chối trên Hard Wall, Soft Brick và ngoài biên. |
| `UT-OWNER-01 -> 06` | Ownership & Capacity | Capacity tính độc lập theo ownerId, đặt bom làm giảm available count, bom `EXPLODING` giải phóng capacity ngay lập tức, không giải phóng 2 lần, bom `FINISHED` không tăng capacity lần nữa, hai owner hoàn toàn độc lập. |
| `UT-COUNTDOWN-01 -> 07` | Đếm lùi Fuse Timer | Giảm chính xác theo delta time, chưa hết fuse không nổ, hết fuse chuyển sang `EXPLODING`, delta = 0 hoặc âm/không hợp lệ được bảo vệ an toàn, nhiều bom hết fuse cùng lúc được xử lý đầy đủ, không đếm đúp trong 1 frame. |
| `UT-LIFE-01 -> 08` | Vòng đời & Chuyển trạng thái | Luồng chuẩn `ARMED` -> `EXPLODING` -> `FINISHED`, luồng sớm `ARMED` -> `TRIGGERED` -> `EXPLODING` -> `FINISHED`, không trigger hai lần, không trigger bom FINISHED, không finish bom khi chưa EXPLODING, dọn dẹp sạch sẽ sau finish, không trùng ID, giải phóng ô về `EMPTY` khi EXPLODING (ADR-013). |
| `UT-EVENT-01 -> 05` | Typed Event Emission | Phát đúng 1 lần các event `BOMB_PLACED`, `BOMB_TRIGGERED`, `BOMB_EXPLODING`, `BOMB_EXPLODED`, `BOMB_FINISHED` với payload type-safe, không phát event khi thao tác bị từ chối. |

### 3.7. Kiểm thử Đi xuyên bom & Tích hợp Input (`PlayerBombPassThrough.test.ts` - Stage 3B.2, ADR-013)
| ID | Kịch bản kiểm thử | Mô tả và kỳ vọng |
| :--- | :--- | :--- |
| `UT-INPUT-01 -> 05` | Phím Space Single-shot | Single-press kích hoạt đặt bom 1 lần, nhấn giữ không tự động đặt lặp lại (no repeat), nhả và nhấn lại kích hoạt lần tiếp, các phím mũi tên / WASD không bị ảnh hưởng, cleanup an toàn. |
| `UT-PLACE-01 -> 06` | Đặt bom từ Player | Đặt đúng ô tâm Player, player lệch tâm vẫn snap chuẩn, từ chối trùng cell, từ chối vượt capacity, từ chối trên tường / gạch, cấp quyền đi xuyên ngay khi đặt thành công. |
| `UT-DISJOINT-01 -> 03` | Công thức Spatial Disjoint AABB | Trả về false khi còn overlap (căn giữa hoặc mép), trả về true khi rời hoàn toàn ra 4 phía (RIGHT, LEFT, UP, DOWN), tiếp xúc đúng đường biên viền được tính là đã disjoint. |
| `UT-PASS-01 -> 04` | Di chuyển & Thu hồi quyền | Không bị kẹt khi vừa đặt bom, di chuyển tự do khi còn overlap, di chuyển sang ô lân cận (4 hướng) kích hoạt thu hồi quyền khi disjoint, sau khi thu hồi không thể quay lại ô bom (bị chặn đứng). |
| `UT-MULTI-01 -> 04` | Cách ly Đa thực thể & Vòng đời | Đặt 2 bom liên tiếp: rời bom A thu hồi A nhưng giữ nguyên quyền bom B; Player 2 bị chặn hoàn toàn bởi bom của Player 1; bom phát nổ dọn sạch quyền trên toàn hệ thống; cleanup xóa sạch quyền. |
| `UT-CORNER-01 -> 02` | Hồi quy Va chạm & Trượt góc | Quả bom rắn (đã revoked) hoạt động như một khối cản 1x1 chuẩn mực, hỗ trợ pixel-flush dừng sát mép và Corner Sliding lách qua góc; tương thích ngược hoàn toàn khi không truyền playerId. |

### 3.8. Kiểm thử Vụ nổ & Lan truyền tia lửa (`ExplosionSystem.test.ts` - Dự kiến Stage 3B.3)
| ID | Kịch bản kiểm thử | Mô tả và kỳ vọng |
| :--- | :--- | :--- |
| `UT-BLAST-01 -> 02` | Chặn tia nổ & Phá gạch | `HARD_WALL` chặn tia nổ không suy chuyển. `SOFT_BRICK` chặn tia nổ và bị phá vỡ (tia nổ không lan qua gạch tiếp theo). |
| `UT-CHAIN-01 -> 03` | Nổ dây chuyền an toàn | Tia nổ quét qua bom kích nổ ngay và tiếp tục lan qua ô bom (DECISION 2). Thuật toán BFS phi đệ quy: chuỗi 5 bom nổ tuần tự, ma trận 2x2 không lặp vô hạn. |
| `UT-STACK-01 -> 02` | Gộp hiển thị (Visual Stacking) | Nhiều vụ nổ cùng chiếm 1 cell được gộp render representation (cross, body, tip), duy trì visual chừng nào còn contribution active (DECISION 3). |
| `UT-DMG-01 -> 04` | Sát thương & Thời lượng | Tia nổ tồn tại đúng 0.4s. Player dính sát thương khi chạm vào và chỉ bị tính thương tích 1 lần (không mất nhiều mạng liên tiếp). |

### 3.7. Kiểm thử hệ thống điểm số & chỉ số (`ScoreSystem.test.ts`)
| ID | Kịch bản kiểm thử | Kỳ vọng |
| :--- | :--- | :--- |
| `UT-SCORE-01` | Giới hạn chỉ số Power-up (Cap) | Nhặt hơn 6 vật phẩm `Bomb Up` thì số lượng bom vẫn giữ ở mức trần là 6. |
| `UT-SCORE-02` | Tính điểm thưởng thời gian | Thời gian còn lại 50s x 10 điểm = +500 điểm thưởng khi thắng màn. |
| `UT-SCORE-03` | Trừ mạng khi bị thương | Bắt đầu với 3 mạng, bị dính đòn lần 1 còn 2 mạng; lần 3 thì kích hoạt sự kiện `GAME_OVER`. |

---

## 4. BẢNG KIỂM TRA KIỂM THỬ THỦ CÔNG & KỊCH BẢN BIÊN (EDGE CASES CHECKLIST)

Bảng này được thực hiện thủ công sau khi hoàn tất các Stage 2, 3, 5, 6:

- [ ] **EC-01: Tự nhốt mình bằng Bom (Self-Trapping & Pass-through - ADR-013)**:
  - *Thao tác*: Người chơi đặt bom tại ngõ cụt 1 ô.
  - *Kỳ vọng*: Nhân vật có thể tự do bước xuyên qua quả bom vừa đặt để thoát ra ngoài (cơ chế Spatial Disjoint AABB). Ngay khi toàn bộ thân nhân vật vừa bước hẳn ra khỏi ô bom, quả bom hóa rắn và chặn hoàn toàn không cho đi ngược trở lại. Không có hiện tượng bị kẹt chết do hết giờ đếm 0.2s.
- [ ] **EC-02: Cảm giác trượt góc (Corner Sliding Feel)**:
  - *Thao tác*: Giữ phím di chuyển và cố tình đi sạt vào góc của cột đá hoặc bờ tường gạch.
  - *Kỳ vọng*: Nhân vật lướt mượt mà vào lối đi, không bị cảm giác "vấp khấc" hoặc dính cứng vào mép tường.
- [ ] **EC-03: Chết đồng thời (Simultaneous Death)**:
  - *Thao tác*: Vụ nổ bom tiêu diệt quái vật cuối cùng đồng thời thiêu rụi người chơi.
  - *Kỳ vọng*: Hệ thống ưu tiên xử lý Người chơi mất mạng (Lose condition) trước khi kích hoạt thắng màn.
- [ ] **EC-04: Hết thời gian đúng lúc vào Cửa thoát**:
  - *Thao tác*: Đồng hồ đếm ngược về đúng `00:00` cùng tích tắc nhân vật chạm vào cửa thoát hiểm.
  - *Kỳ vọng*: Trò chơi xử lý nhất quán (hết giờ = Game Over).
- [ ] **EC-05: Tạm dừng và Tiếp tục (Pause / Resume)**:
  - *Thao tác*: Nhấn `P` khi bom sắp nổ và quái vật đang đuổi theo, đợi 5 giây rồi nhấn `P` tiếp tục.
  - *Kỳ vọng*: Bom không bị nổ trước thời hạn, quái vật không bị teleport, đồng hồ không bị trôi thời gian.
- [ ] **EC-06: Khởi động lại màn chơi nhiều lần (Memory Leak Check)**:
  - *Thao tác*: Chơi thua và nhấn "Chơi Lại" liên tục 15 lần.
  - *Kỳ vọng*: Số lượng Event Listeners trên `EventBus` không tăng lũy tiến, FPS duy trì ổn định 60, dung lượng RAM trong Task Manager không bị tăng vọt.

---

## 5. MA TRẬN KIỂM THỬ MÔI TRƯỜNG & TRÌNH DUYỆT (BROWSER MATRIX)

| Trình duyệt | Nền tảng HĐH | Chế độ Render | Tiêu chí đạt chuẩn |
| :--- | :--- | :--- | :--- |
| **Google Chrome** (v120+) | Windows 10/11 | WebGL 2.0 | 60 FPS, âm thanh Web Audio mượt |
| **Mozilla Firefox** (v120+) | Windows 10/11 | WebGL 2.0 | 60 FPS, Canvas căn giữa chuẩn |
| **Microsoft Edge** (v120+) | Windows 10/11 | WebGL 2.0 | 60 FPS, không có giật lag |
| **Apple Safari** (v17+) | macOS Sonoma | WebGL / Metal | Khởi chạy trơn tru, hỗ trợ phím bấm |
