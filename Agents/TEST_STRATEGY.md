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

### 3.2. Kiểm thử ma trận bản đồ (`GridSystem.test.ts`)
| ID | Kịch bản kiểm thử | Mô tả kiểm tra |
| :--- | :--- | :--- |
| `UT-GRID-01` | Khởi tạo tường bao quanh | Đảm bảo 100% các ô thuộc biên (hàng 0, 12 và cột 0, 14) đều là `HARD_WALL`. |
| `UT-GRID-02` | Khởi tạo trụ cột cố định | Đảm bảo các ô có `x % 2 == 0 && y % 2 == 0` đều là `HARD_WALL`. |
| `UT-GRID-03` | Bảo vệ vùng xuất phát an toàn | Đảm bảo 3 ô `(1,1)`, `(1,2)`, `(2,1)` luôn là `EMPTY`, không bao giờ có gạch mềm. |

### 3.3. Kiểm thử thuật toán lan truyền vụ nổ (`BlastRaycast.test.ts`)
| ID | Kịch bản kiểm thử | Mô tả và kỳ vọng |
| :--- | :--- | :--- |
| `UT-BLAST-01` | Tia lửa nổ gặp Tường cứng | Khi gặp `HARD_WALL`, tia nổ lập tức dừng lại, ô tường cứng không bị biến đổi. |
| `UT-BLAST-02` | Tia lửa nổ gặp Gạch mềm | Khi gặp `SOFT_BRICK`, tia nổ phá vỡ gạch và **DỪNG LẠI**, không lan tiếp ra ô phía sau dù tầm nổ vẫn còn dư. |
| `UT-BLAST-03` | Nổ dây chuyền (Chain Reaction) | Nếu trong phạm vi tia lửa có quả bom thứ 2, quả bom thứ 2 phải được kích nổ ngay lập tức. |
| `UT-BLAST-04` | Thiêu rụi vật phẩm | Nếu tia lửa quét qua ô đang chứa `PowerUp`, vật phẩm đó phải bị xóa khỏi sàn. |

### 3.4. Kiểm thử hệ thống điểm số & chỉ số (`ScoreSystem.test.ts`)
| ID | Kịch bản kiểm thử | Kỳ vọng |
| :--- | :--- | :--- |
| `UT-SCORE-01` | Giới hạn chỉ số Power-up (Cap) | Nhặt hơn 6 vật phẩm `Bomb Up` thì số lượng bom vẫn giữ ở mức trần là 6. |
| `UT-SCORE-02` | Tính điểm thưởng thời gian | Thời gian còn lại 50s x 10 điểm = +500 điểm thưởng khi thắng màn. |
| `UT-SCORE-03` | Trừ mạng khi bị thương | Bắt đầu với 3 mạng, bị dính đòn lần 1 còn 2 mạng; lần 3 thì kích hoạt sự kiện `GAME_OVER`. |

---

## 4. BẢNG KIỂM TRA KIỂM THỬ THỦ CÔNG & KỊCH BẢN BIÊN (EDGE CASES CHECKLIST)

Bảng này được thực hiện thủ công sau khi hoàn tất các Stage 2, 3, 5, 6:

- [ ] **EC-01: Tự nhốt mình bằng Bom (Self-Trapping)**:
  - *Thao tác*: Người chơi đặt bom tại ngõ cụt 1 ô.
  - *Kỳ vọng*: Trong 0.2 giây đầu tiên, nhân vật có thể bước xuyên qua quả bom vừa đặt để thoát ra. Sau 0.2 giây, quả bom hóa rắn và chặn hoàn toàn đường đi.
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
