# BÁO CÁO KỸ THUẬT PHỤC HỒI & HOÀN TẤT STAGE 3B.3A
## RECOVERY & COMPLETION OF EXPLOSION SYSTEM TECHNICAL DESIGN

> **Dự án**: Bomber Game (Classic Bomberman Remake - Phaser 3 + TypeScript + Vite)  
> **Giai đoạn**: **Stage 3B.3A – Technical Design Recovery & Architecture Specification**  
> **Chịu trách nhiệm**: Senior Game Developer & Software Architect (DeepMind Team)  
> **Trạng thái**: **COMPLETED & AWAITING TECHNICAL AUDIT APPROVAL (CHỜ PHÊ DUYỆT ĐỂ BƯỚC SANG 3B.3B)**  
> **Ngày thực hiện**: 09/11/2026  

---

## 1. TỔNG QUAN PHỤC HỒI GIAI ĐOẠN (RECOVERY OVERVIEW)

Trong phiên thực thi trước, hai tài liệu bắt buộc của Stage 3B.3A chưa được phát hiện đầy đủ trên hệ thống:
- `Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md`
- `Agents/STAGE_3B_3A_REPORT.md`

Thực hiện đúng chỉ thị phục hồi (Recovery Execution), Agent đã tiến hành rà soát toàn bộ hiện trạng mã nguồn, khôi phục các tệp tin theo đúng chuẩn mực, biên soạn hoàn chỉnh tài liệu thiết kế kỹ thuật phân hệ Vụ nổ & Nổ dây chuyền, bảo tồn 100% quyết định kiến trúc tại **ADR-013**, và tuyệt đối **không chỉnh sửa bất kỳ dòng mã nguồn gameplay nào**.

---

## 2. CÁC TÀI LIỆU VÀ TỆP NGUỒN ĐÃ ĐỐI SOÁT (INSPECTED ARTIFACTS)

Agent đã rà soát kỹ lưỡng các tài liệu kiến trúc và mã nguồn thực tế:

### Tài liệu quản trị & kiến trúc:
1. [`GEMINI.md`](file:///C:/Git/Bomber/Bomber/GEMINI.md): Chỉ thị tối cao về phân tầng trách nhiệm (Scenes, Systems, Entities, EventBus), nguyên tắc Single Responsibility, quy trình kiểm soát qua Approval Gates, và quy định sử dụng Tiếng Việt.
2. [`Agents/IMPLEMENTATION_ROADMAP.md`](file:///C:/Git/Bomber/Bomber/Agents/IMPLEMENTATION_ROADMAP.md): Lộ trình phát triển và các tiêu chí nghiệm thu từng Stage.
3. [`Agents/DECISION_LOG.md`](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md): Kiểm tra các quyết định kiến trúc đã được phê duyệt, đặc biệt là **ADR-012** (Kinematic Sensor Body) và **ADR-013** (Spatial Disjoint AABB, Penetrating Blast, BFS Chain Reaction, Visual Stacking).
4. [`Agents/STAGE_3A_TECHNICAL_DESIGN.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3A_TECHNICAL_DESIGN.md): Tài liệu thiết kế tổng thể phân hệ Bom & Vụ nổ ban đầu.
5. [`Agents/STAGE_3B_2_REPORT.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_2_REPORT.md): Báo cáo nghiệm thu hoàn thành Stage 3B.2 (Player Bomb Pass-through & Input Integration).

### Mã nguồn hiện hữu tại nhánh `main`:
1. [`src/systems/BombSystem.ts`](file:///C:/Git/Bomber/Bomber/src/systems/BombSystem.ts): Hệ thống quản lý bom, kiểm tra vòng đời `ARMED -> TRIGGERED -> EXPLODING -> FINISHED`, hồi capacity và giải phóng ô lưới.
2. [`src/systems/BombPassThroughManager.ts`](file:///C:/Git/Bomber/Bomber/src/systems/BombPassThroughManager.ts): Thuật toán Spatial Disjoint AABB độc lập.
3. [`src/systems/GridSystem.ts`](file:///C:/Git/Bomber/Bomber/src/systems/GridSystem.ts): Các API thao tác ô lưới (`getTile`, `setTile`, `isWalkable`, `blocksBlast`, `destroySoftWall`).
4. [`src/types/Tile.types.ts`](file:///C:/Git/Bomber/Bomber/src/types/Tile.types.ts): Thuộc tính hành vi của các Tile (`TileType.BOMB` có `blocksBlast = false`).
5. [`src/entities/Player.ts`](file:///C:/Git/Bomber/Bomber/src/entities/Player.ts) & [`src/systems/PlayerCollisionSystem.ts`](file:///C:/Git/Bomber/Bomber/src/systems/PlayerCollisionSystem.ts): Kinematic movement, Sub-stepping, Corner Sliding.
6. [`tests/BombSystem.test.ts`](file:///C:/Git/Bomber/Bomber/tests/BombSystem.test.ts) & [`tests/PlayerBombPassThrough.test.ts`](file:///C:/Git/Bomber/Bomber/tests/PlayerBombPassThrough.test.ts): Bộ 140 Unit Tests nền tảng đảm bảo tính toàn vẹn 100%.

---

## 3. CÁC QUYẾT ĐỊNH THIẾT KẾ KỸ THUẬT VÀ LÝ DO LỰA CHỌN

Tài liệu [`Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md) đã được xây dựng hoàn thiện với các điểm tựa kỹ thuật cốt lõi:

1. **Phân tách Trách nhiệm Rạch ròi giữa Raycaster và ExplosionSystem**:
   - `ExplosionRaycaster`: Pure Calculation Engine (Hàm thuần túy). Nhận tọa độ tâm và bán kính `power`, quét 4 hướng trực giao và trả về cấu trúc `IBlastRayResult`. Không tự ý mutate dữ liệu bản đồ hay quả bom.
   - `ExplosionSystem`: Điều phối viên Vụ nổ (Orchestrator). Quản lý hàng đợi BFS, tương tác với `BombSystem` để chuyển bom sang `EXPLODING` / `FINISHED`, gọi `GridSystem.destroySoftWall()` để phá gạch mềm, và theo dõi thời lượng 0.4s.
2. **Kích nổ Dây chuyền Phi đệ quy (Non-recursive BFS Chain Reaction)**:
   - Thay vì gọi hàm đệ quy (dễ gây Call Stack Overflow khi có chuỗi 15-20 bom), sử dụng hàng đợi phẳng `explosionQueue: IBombData[]` kết hợp `processedBombIds: Set<string>`.
   - Độ phức tạp tuyến tính $O(N)$ tối ưu tuyệt đối, triệt tiêu nguy cơ duyệt lặp quả bom.
3. **Mô hình Quản lý Đóng góp Độc lập & Gộp Hiển thị Theo Ô (CellExplosionTracker)**:
   - Khi nhiều vụ nổ giao thoa trên 1 cell: gộp texture hiển thị (`CENTER`, `CROSS`, `BODY`, `TIP`) để tối ưu draw call của Canvas.
   - Bảo toàn danh sách `contributions` của từng vụ nổ trên ô: mỗi vụ nổ tự đếm lùi 0.4s của riêng mình; ô chỉ hết lửa khi toàn bộ đóng góp kết thúc.
4. **Chuẩn hóa Đầu mút Tia lửa (`isTip = true`)**:
   - Phân đoạn cuối cùng thực sự được sinh ra của mỗi nhánh hướng luôn được đánh dấu là `isTip = true` (dù dừng do hết `power` hay do gặp Gạch mềm). Các phân đoạn ở giữa là thân (`isTip = false`).

---

## 4. XÁC NHẬN TUÂN THỦ TUYỆT ĐỐI CÁC QUYẾT ĐỊNH KIẾN TRÚC ĐÃ PHÊ DUYỆT (COMPATIBILITY VERIFICATION)

Bản thiết kế kỹ thuật tuân thủ nghiêm ngặt toàn bộ các quyết định kiến trúc đã phê chuẩn trong [ADR-013](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-013) và tài liệu thẩm quyền gốc:

- [x] **ADR-013 (Quyết định 1 - Spatial Disjoint AABB Pass-through)**: Bãi bỏ timer 0.2s; Player được đi xuyên bom vừa đặt cho đến khi rời hẳn khỏi cell; quản lý cặp quyền độc lập `(playerId, bombId)`; hoàn trả capacity (`activeBombCount--`) và giải phóng ô lưới về `TileType.EMPTY` ngay thời điểm bom phát nổ (`EXPLODING`).
- [x] **ADR-013 (Quyết định 2 - Non-recursive BFS Chain Reaction & Penetrating Blast)**: Bom bị tia lửa quét trúng kích nổ tức thì trong cùng frame; ô bom không chặn tia nổ (`blocksBlast = false`) cho phép tia lửa tiếp tục lan nếu còn tầm nổ; hàng đợi BFS phi đệ quy kết hợp tập hợp `processedBombIds` loại bỏ 100% rủi ro Stack Overflow.
- [x] **ADR-013 (Quyết định 3 - Cell-based Visual Stacking & State Contribution Tracking)**: Quản lý vụ nổ theo từng cell qua `CellExplosionTracker`; gộp visual hiển thị theo cell tối ưu draw call canvas; duy trì danh sách đóng góp độc lập; visual chỉ bị hủy khi `activeCount === 0`.
- [x] **Thời lượng Vụ nổ Chuẩn $0.4\text{s}$ (GDD Mục 3.3 & Roadmap Stage 3)**: Duy trì chính xác thời lượng $0.4\text{s}$ (`EXPLOSION_CONFIG.DURATION = 0.4s`) cho vụ nổ.

---

## 5. DANH MỤC CÁC QUYẾT ĐỊNH MỞ CẦN PHÊ CHUẨN (OPEN DECISIONS)

Tài liệu thiết kế đã tách bạch rõ ràng **10 câu hỏi mở** tại Mục 14 của [`Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md), không tự ý chuyển thành quyết định chính thức:

1. **Ngữ nghĩa bán kính `blastPower`**: `power = 1` là tia nổ 1 ô mỗi hướng (tổng chữ thập 5 ô gồm tâm + 4 cánh).
2. **Thời điểm phá hủy Gạch mềm**: Ô gạch được đánh dấu phá hủy ngay trong logic ma trận lưới hay chờ hoạt ảnh vỡ vụn (0.3s) kết thúc mới thành walkable?
3. **Hành vi Cửa Thoát hiểm ẩn**: Lộ diện ngay khi gạch vỡ và miễn nhiễm 100% với tia lửa nổ.
4. **Vật phẩm sinh ra từ Gạch vỡ**: Có được bảo vệ khỏi tia lửa nổ hiện tại của quả bom vừa phá gạch không?
5. **Nhiều vụ nổ cùng đánh vào một viên gạch mềm**: Khử trùng lặp sự kiện `BLOCK_DESTROYED` thông qua cờ trạng thái của `GridSystem.destroySoftWall()`.
6. **Thời lượng Bất tử của Player (i-frames)**: Đề xuất $2.0\text{s}$ kèm hiệu ứng chớp tắt (alpha blinking).
7. **Player bước vào ô đang có lửa**: Lập tức bị dính sát thương nếu không có i-frames.
8. **Thời lượng Sát thương vs Thời lượng Thị giác**: Duy trì đồng nhất sát thương trọn vẹn trong $0.4\text{s}$ đối với MVP.
9. **Thứ tự Cập nhật Hệ thống (Update Order)**: Đề xuất Input -> BombSystem -> ExplosionSystem -> PlayerCollisionSystem -> Damage Check -> Render.
10. **Tính tất định trong thứ tự duyệt nhánh của BFS**: Cố định mảng thứ tự duyệt `['UP', 'DOWN', 'LEFT', 'RIGHT']`.

---

## 6. DANH MỤC CÁC TỆP ĐÃ TẠO MỚI HOẶC CHỈNH SỬA

| Đường dẫn tệp tin | Hành động | Nội dung chính |
| :--- | :---: | :--- |
| [`Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md) | **Tạo mới** | Tài liệu thiết kế kỹ thuật đầy đủ 14 đề mục bắt buộc, sơ đồ Mermaid, ma trận ADR-013, 10 Open Decisions. |
| [`Agents/STAGE_3B_3A_REPORT.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_REPORT.md) | **Cập nhật** | Báo cáo phục hồi và đối soát kỹ thuật toàn diện cho Stage 3B.3A. |
| [`Agents/IMPLEMENTATION_ROADMAP.md`](file:///C:/Git/Bomber/Bomber/Agents/IMPLEMENTATION_ROADMAP.md) | **Cập nhật** | Cập nhật lộ trình: Stage 3B.3A ở trạng thái ĐÃ HOÀN TẤT THIẾT KẾ – CHỜ PHÊ DUYỆT (Chưa đánh dấu duyệt). |

---

## 7. XÁC NHẬN KHÔNG CHỈNH SỬA MÃ NGUỒN GAMEPLAY (STRICT VERIFICATION)

Agent xác nhận và cam kết tuân thủ nghiêm ngặt chỉ thị:
- **0 dòng code gameplay bị chỉnh sửa**: Toàn bộ thư mục `src/` và `tests/` được giữ nguyên vẹn 100% ở trạng thái sạch của Stage 3B.2 (`git status` trên `src/` và `tests/` sạch hoàn toàn).
- **Không tự ý triển khai code Stage 3B.3B**: Chưa tạo bất kỳ file code logic nào cho `ExplosionSystem.ts` hay `ExplosionRaycaster.ts`.
- **Bộ kiểm thử nền tảng nguyên vẹn**: Chạy lệnh kiểm thử tự động xác nhận **140/140 tests PASS 100%**:

```
 RUN  v1.6.1 C:/Git/Bomber/Bomber

 ✓ tests/CornerSliding.test.ts  (17 tests) 9ms
 ✓ tests/BombSystem.test.ts  (34 tests) 21ms
 ✓ tests/PlayerBombPassThrough.test.ts  (24 tests) 17ms
 ✓ tests/GridSystem.test.ts  (11 tests) 9ms
 ✓ tests/PlayerMovement.test.ts  (8 tests) 7ms
 ✓ tests/PlayerCollision.test.ts  (6 tests) 7ms
 ✓ tests/PlayerInput.test.ts  (8 tests) 4ms
 ✓ tests/GridMath.test.ts  (11 tests) 6ms
 ✓ tests/MapGenerator.test.ts  (8 tests) 9ms
 ✓ tests/GameMap.test.ts  (5 tests) 5ms
 ✓ tests/EventBus.test.ts  (4 tests) 8ms
 ✓ tests/PlayerHitbox.test.ts  (4 tests) 7ms

 Test Files  12 passed (12)
      Tests  140 passed (140)
```

---

## 8. GIỚI HẠN & VẤN ĐỀ CẦN GIẢI QUYẾT TIẾP THEO

- **Giới hạn hiện tại**: Toàn bộ Stage 3B.3A chỉ dừng lại ở phạm vi thiết kế kỹ thuật và kiến trúc tài liệu. Chưa có mã nguồn thực thi hay test suite mới được tích hợp vào `src/` hoặc `tests/`.
- **Bước tiếp theo (Stage 3B.3B)**: Sau khi Technical Lead / User xem xét tài liệu thiết kế và định hướng 10 Open Decisions, hệ thống sẽ tiến hành triển khai mã nguồn Headless và viết bộ unit test tương ứng.
