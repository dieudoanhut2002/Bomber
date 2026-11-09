# BÁO CÁO KỸ THUẬT NGHIỆM THU STAGE 3B.3A.2
## DECISION TRACEABILITY CORRECTION REPORT (VERSION 1.2.0)

> **Dự án**: Bomber Game (Classic Bomberman Remake - Phaser 3 + TypeScript + Vite)  
> **Giai đoạn**: **Stage 3B.3A.2 – Decision Traceability Correction**  
> **Người thực hiện**: Senior Game Developer & Software Architect (DeepMind Team)  
> **Tài liệu chuẩn hóa chính**: [`Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md) (v1.2.0)  
> **Tài liệu hiệu chỉnh phụ**: [`Agents/STAGE_3B_3A_1_REPORT.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_1_REPORT.md), [`Agents/IMPLEMENTATION_ROADMAP.md`](file:///C:/Git/Bomber/Bomber/Agents/IMPLEMENTATION_ROADMAP.md)  
> **Văn bản pháp quy được bảo toàn**: [`Agents/DECISION_LOG.md`](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md) (ADR-001 đến ADR-013)  
> **Kết luận nghiệm thu**: **`TRACEABILITY CORRECTION COMPLETED – READY FOR INDEPENDENT REVIEW`**  
> **Trạng thái Stage 3B.3B**: **`STRICTLY NOT AUTHORIZED / PENDING APPROVAL`**  

---

## 1. MỤC TIÊU CỦA STAGE 3B.3A.2

Sau khi phiên kiểm toán độc lập (*Independent ADR Verification*) phát hiện một số quyết định và test cases trong tài liệu thiết kế v1.1.0 tham chiếu đến các mục ADR không tồn tại (`ADR-013.6`, `ADR-013.7`), đồng thời mục `OD-08` bị gắn nhãn *Approved Decision* mà chưa có bằng chứng phê duyệt chính thức trong ADR, phiên **Stage 3B.3A.2** được kích hoạt nhằm thực hiện:
1. Bảo đảm mọi *Approved Decision* đều có nguồn phê duyệt thực tế và có thẩm quyền.
2. Bảo đảm mọi tham chiếu ADR đều tồn tại thực tế và trỏ chính xác vào nội dung điều khoản gốc.
3. Phân biệt rạch ròi giữa *Approved Architecture Decisions* với *Proposed Design*.
4. Phân định rõ ràng 5 khái niệm ngữ nghĩa: Grid Occupancy, Bomb Entity Registry, Spatial Lookup, Movement Blocking, và Explosion Contributions.
5. Làm rõ phân tích độ phức tạp thời gian $O(N \cdot P)$ là sự cụ thể hóa kỹ thuật ở cấp độ thao tác vật lý ô lưới, bảo toàn 100% quyết định kiến trúc BFS phi đệ quy trong ADR-013 Decision 2.
6. Bảo toàn nguyên vẹn toàn bộ các quyết định đã được phê duyệt trong `Agents/DECISION_LOG.md` (ADR-001 đến ADR-013), tuyệt đối không chỉnh sửa `DECISION_LOG.md`.
7. **Phạm vi nghiêm ngặt**: Chỉ chỉnh sửa tài liệu được phép, tuyệt đối không viết code `src/` hoặc `tests/`, không Git commit, không bắt đầu Stage 3B.3B.

---

## 2. CÁC TÀI LIỆU ĐÃ KIỂM TRA THỰC TẾ (INSPECTED DOCUMENTS)

1. [`GEMINI.md`](file:///C:/Git/Bomber/Bomber/GEMINI.md): Chỉ thị Quản trị Tối cao, nguyên tắc phân tách trách nhiệm (SRP), Type-Safe nghiêm ngặt, quy trình Approval Gates, Dos & Don'ts.
2. [`Agents/DECISION_LOG.md`](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md): Kiểm tra thực tế toàn bộ văn bản từ ADR-001 đến ADR-013. Xác nhận ADR-013 gồm chính xác 3 quyết định kiến trúc (Quyết định 1, Quyết định 2, Quyết định 3); không có tiểu mục `.6` hay `.7`.
3. [`Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md): Rà soát toàn bộ 14 đề mục thiết kế kỹ thuật, sửa đổi và nâng cấp lên v1.2.0.
4. [`Agents/STAGE_3B_3A_1_REPORT.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_1_REPORT.md): Kiểm tra và hiệu chỉnh các dòng ghi nhận OD-08 để không còn trích dẫn sai `ADR-013.6`.
5. [`Agents/IMPLEMENTATION_ROADMAP.md`](file:///C:/Git/Bomber/Bomber/Agents/IMPLEMENTATION_ROADMAP.md): Đồng bộ tiến trình dự án, ghi nhận Stage 3B.3A.2 hoàn tất chuẩn hóa v1.2.0, giữ Stage 3B.3B ở trạng thái **NOT AUTHORIZED / PENDING APPROVAL**.
6. [`Agents/GAME_DESIGN_DOCUMENT.md`](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md): Đối chiếu các quy chuẩn game tại Mục 3.1 (Player Hitbox 28x28, lives), Mục 3.2 (Bomb fuse 3.0s, pulse), Mục 3.3 (Explosion duration 0.4s, raycast blocking rules, penetrating blast, visual stacking).
7. [`Agents/PRODUCT_REQUIREMENTS.md`](file:///C:/Git/Bomber/Bomber/Agents/PRODUCT_REQUIREMENTS.md): Đối chiếu User Story US-02 (Đặt bom, grid snapping, fuse 3s, tầm nổ ban đầu 1 ô hình chữ thập).

---

## 3. CÁC PHÁT HIỆN KIỂM TOÁN (FINDINGS DT-01 ĐẾN DT-04)

### 3.1. Finding DT-01: OD-08 bị gắn nhãn Approved Decision không có căn cứ
- **Hiện trạng trong v1.1.0**: Ghi nhận `OD-08: Hitbox sát thương và visual cùng tồn tại đúng 0.4s. [Approved Decision - ADR-013.6]`.
- **Kết quả đối soát thực tế**: ADR-013 chỉ gồm 3 quyết định kiến trúc, hoàn toàn không có mục `ADR-013.6`. ADR-013 Decision 3 chỉ quy định về Visual Stacking theo cell (`activeCount === 0`), không quy định thời lượng vụ nổ hay thời lượng hitbox sát thương. Mặc dù GDD Mục 3.3 có mô tả thời lượng tia lửa là $0.4\text{s}$, việc quyết định hitbox sát thương tồn tại đồng nhất trọn vẹn $0.4\text{s}$ (Phương án A) hay tắt sớm tại $0.2\text{s}$ (Phương án B) là một vấn đề thiết kế gameplay/kiến trúc chưa từng được User thông qua ADR chính thức.

### 3.2. Finding DT-02: Các tham chiếu phantom `ADR-013.6` và `ADR-013.7`
- **Hiện trạng trong v1.1.0**: Test Matrix và văn bản sử dụng các mã phantom `ADR-013.4`, `ADR-013.5`, `ADR-013.6`, `ADR-013.7`.
- **Kết quả đối soát thực tế**: ADR-013 chỉ có 3 quyết định lớn:
  - Decision 1: Spatial Disjoint AABB Pass-through (AABB overlap check, cặp entity mapping, capacity và grid cell giải phóng tại `EXPLODING`).
  - Decision 2: Non-recursive BFS Chain Reaction & Penetrating Blast (Instant detonation, `TileType.BOMB.blocksBlast = false`, BFS queue với `processedBombIds`).
  - Decision 3: Cell-based Visual Stacking & State Contribution Tracking (`CellExplosionTracker`).

### 3.3. Finding DT-03: Nhập nhằng giữa Grid Occupancy và Bomb Entity Lookup
- **Hiện trạng trong v1.1.0**: Mô tả bomb sau khi sang `EXPLODING` vẫn nằm trong `bombsById` và `bombsByCoord`, trong khi ADR-013 Decision 1 quy định ô lưới được giải phóng về `TileType.EMPTY` và capacity được hoàn trả tại `EXPLODING`. Sự thiếu phân định rõ ràng giữa Grid Occupancy (`GridSystem`) và Entity Registry (`BombSystem`) có thể gây hiểu nhầm là bomb vẫn chiếm ô cản đường.

### 3.4. Finding DT-04: Mối quan hệ trong Phân tích Độ phức tạp Thuật toán
- **Hiện trạng trong v1.1.0**: ADR-013 Decision 2 ghi nhận BFS có độ phức tạp $O(N)$, trong khi Technical Design ghi $O(N \cdot P)$. Cần làm rõ đây là sự cụ thể hóa kỹ thuật ở cấp độ thao tác vật lý ô lưới, không phải thay đổi quyết định kiến trúc BFS phi đệ quy đã phê duyệt.

---

## 4. HÀNH ĐỘNG XỬ LÝ CHI TIẾT TỪNG FINDING

| Finding | Hành động Xử lý Cụ thể trong Tài liệu | Vị trí Hiệu chỉnh | Trạng thái |
| :---: | :--- | :---: | :---: |
| **DT-01** | • Chuyển `OD-08` thành **`Proposed Design`** (Đề xuất Phương án A theo GDD Mục 3.3, cần User / Tech Lead phê duyệt).<br/>• Loại bỏ hoàn toàn nhãn *Approved Decision* và mã trích dẫn `ADR-013.6`.<br/>• Hiệu chỉnh đồng bộ trong cả `STAGE_3B_3A_TECHNICAL_DESIGN.md` và `STAGE_3B_3A_1_REPORT.md`. | Mục 14 & Mục 2 `TECHNICAL_DESIGN`; Mục 4.4 & Mục 7 `1_REPORT` | **RESOLVED** |
| **DT-02** | • Bãi bỏ 100% các ký hiệu phantom `ADR-013.1` đến `ADR-013.7`.<br/>• Khôi phục trích dẫn chuẩn tắc theo đúng cấu trúc 3 quyết định gốc: `ADR-013 (Quyết định 1)`, `ADR-013 (Quyết định 2)`, `ADR-013 (Quyết định 3)`.<br/>• Tái định vị nguồn gốc thời lượng $0.4\text{s}$ về đúng văn bản thẩm quyền gốc là [GDD Mục 3.3](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#33-v%E1%BB%A5-n%E1%BB%95--tia-l%E1%BB%ADa-explosion--blast-waves) và Roadmap Stage 3.<br/>• Rà soát và cập nhật toàn bộ 35 bài test trong Ma trận Kiểm thử về đúng nguồn thẩm quyền gốc (23 Approved Requirement Tests, 12 Proposed Design Tests). | Mục 2 & Mục 13 `TECHNICAL_DESIGN` | **RESOLVED** |
| **DT-03** | • Xây dựng bảng ma trận phân định rạch ròi 5 khái niệm ngữ nghĩa tại Mục 5.1:<br/>  1. **Grid Occupancy**: `GridSystem` giải phóng ô lưới về `TileType.EMPTY` ngay tại `EXPLODING` (ADR-013 Quyết định 1).<br/>  2. **Bomb Entity Registry**: `BombSystem.bombsById` giữ thực thể bomb đang `EXPLODING` để theo dõi vòng đời vụ nổ; capacity đã hoàn trả đúng 1 lần (`isCapacityReleased = true`).<br/>  3. **Bomb Spatial Lookup**: `BombSystem.getBombAt(coord)` cho phép Raycaster nhận diện bomb ARMED (để trigger) vs bomb EXPLODING (để đi xuyên qua, không trigger lại).<br/>  4. **Movement Blocking**: Bomb `EXPLODING` có `movement blocking = false` (không cản đường), chỉ gây tương tác hazard do `ExplosionSystem` quản lý.<br/>  5. **Explosion Contributions**: `CellExplosionTracker` quản lý độc lập trạng thái ngọn lửa trên ô.<br/>• `finishBomb()` chỉ thực hiện gỡ bỏ entity sau $0.4\text{s}$, tuyệt đối idempotent. | Mục 3.1, 3.3, 5.1 `TECHNICAL_DESIGN` | **RESOLVED** |
| **DT-04** | • Bổ sung khối Alert Note tại Mục 5.5 giải thích minh bạch mối quan hệ:<br/>  - ADR-013 Decision 2: Tuyên bố $O(N)$ ở cấp độ trừu tượng hóa đồ thị kích nổ ($N$ đỉnh bom được duyệt qua BFS queue không bao giờ bị lặp lại).<br/>  - Technical Design: Cụ thể hóa kỹ thuật (Technical Clarification) ở cấp độ thao tác vật lý ô lưới khi mỗi bomb quét 4 hướng, mỗi hướng tối đa $P$ bước. Do mỗi bước là $O(1)$ và dequeue Head-index là $O(1)$, tổng chi phí là $O(N \cdot P)$.<br/>• Định nghĩa chính xác $N$ (số bom kích nổ) và $P$ (`blastPower`).<br/>• Quyết định kiến trúc BFS phi đệ quy trong ADR-013 được bảo toàn nguyên vẹn 100%, không chỉnh sửa `DECISION_LOG.md`. | Mục 5.5 & Mục 7.2 `TECHNICAL_DESIGN` | **RESOLVED** |

---

## 5. DANH SÁCH APPROVED DECISIONS SAU HIỆU CHỈNH

Toàn bộ các quyết định dưới đây đều có bằng chứng phê duyệt bằng văn bản chính thức trong kho lưu trữ:

| ID Quyết định / Quy chuẩn | Nguồn Thẩm Quyền Phê Duyệt | Nội dung Được Phê Duyệt Chính Thức |
| :--- | :--- | :--- |
| **Bản đồ Bất biến & PRNG** | [ADR-010](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-010) | `GameMap` sâu bất biến; thuật toán PRNG Mulberry32 sinh bản đồ tất định. |
| **Player Kinematic Sensor Body** | [ADR-012](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-012) & [GDD Mục 3.1](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#31-nh%C3%A2n-v%E1%BA%ADt-bomber-player) | Hitbox 28x28 căn giữa trên tile 48x48. `body.moves = false`. Arcade Body chỉ đóng vai trò Sensor Trigger cho Overlap detection. |
| **Corner Sliding & Sub-stepping** | [ADR-011](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-011) & [ADR-012](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-012) | Corridor Entry Auto-Centering và T-Junction Rounding với ngưỡng 14px, sub-stepping tối đa 4px. |
| **Spatial Disjoint AABB Pass-through** | [ADR-013 (Quyết định 1)](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-013) & [GDD Mục 3.2](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#32-qu%E1%BA%A3-bom-bomb) | Bãi bỏ timer 0.2s. Áp dụng Spatial Disjoint AABB: Player vừa đặt bom được đi xuyên bom cho đến khi AABB hoàn toàn không còn giao cắt với cell chứa bom. |
| **Phân quyền Pass-through theo Entity** | [ADR-013 (Quyết định 1)](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-013) | Quản lý độc lập theo từng cặp `(playerId, bombId)`. Quái vật và người chơi khác bị cản cứng ngay từ đầu. |
| **Hồi Capacity ngay tại `EXPLODING`** | [ADR-013 (Quyết định 1)](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-013) & [GDD Mục 3.2](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#32-qu%E1%BA%A3-bom-bomb) | Hồi lại `bombCapacity` (`activeBombCount--`) ngay thời điểm bom phát nổ (`EXPLODING`), không chờ vụ nổ tắt. |
| **Giải phóng Ô lưới ngay tại `EXPLODING`** | [ADR-013 (Quyết định 1)](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-013) | Ô trên `GridSystem` được giải phóng về `TileType.EMPTY` ngay thời điểm bom phát nổ (`EXPLODING`). |
| **Kích nổ tức thì Bom Lân cận** | [ADR-013 (Quyết định 2)](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-013) & [GDD Mục 3.3](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#33-v%E1%BB%A5-n%E1%BB%95--tia-l%E1%BB%ADa-explosion--blast-waves) | Quả bom bị tia lửa quét trúng chuyển ngay sang `TRIGGERED` và nổ tức thì trong cùng frame. |
| **Penetrating Blast (Quét xuyên bom)** | [ADR-013 (Quyết định 2)](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-013) & [GDD Mục 3.3](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#33-v%E1%BB%A5-n%E1%BB%95--tia-l%E1%BB%ADa-explosion--blast-waves) | Tia lửa tiếp tục lan qua ô chứa quả bom nếu vẫn còn tầm nổ (`TileType.BOMB.blocksBlast = false`). |
| **Hàng đợi BFS phi đệ quy & De-duplication** | [ADR-013 (Quyết định 2)](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-013) | Thuật toán BFS phi đệ quy kết hợp `Set<string>` đánh dấu `processedBombIds`, không bao giờ xử lý 1 bom 2 lần, loại bỏ 100% rủi ro Stack Overflow. |
| **Cell-based Visual Stacking** | [ADR-013 (Quyết định 3)](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md#adr-013) & [GDD Mục 3.3](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#33-v%E1%BB%A5-n%E1%BB%95--tia-l%E1%BB%ADa-explosion--blast-waves) | Quản lý vụ nổ theo cell (`CellExplosionTracker`), gộp visual hiển thị theo cell, bảo toàn danh sách contributions độc lập, visual chỉ bị xóa khi `activeCount === 0`. |
| **Thời lượng Vụ nổ $0.4\text{s}$** | [GDD Mục 3.3](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#33-v%E1%BB%A5-n%E1%BB%95--tia-l%E1%BB%ADa-explosion--blast-waves) & [Roadmap Stage 3](file:///C:/Git/Bomber/Bomber/Agents/IMPLEMENTATION_ROADMAP.md) | Thời gian tồn tại của tia lửa (Duration) là 0.4 giây. |
| **Quy tắc Chặn Tia nổ Tường & Gạch** | [PRD US-02](file:///C:/Git/Bomber/Bomber/Agents/PRODUCT_REQUIREMENTS.md#us-02-%C4%91%E1%BA%B7t-bom-v%C3%A0-k%C3%ADch-ho%E1%BA%A1t-v%E1%BB%A5-n%E1%BB%95) & [GDD Mục 3.3](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#33-v%E1%BB%A5-n%E1%BB%95--tia-l%E1%BB%ADa-explosion--blast-waves) | Tường cứng chặn hoàn toàn; Gạch mềm bị phá hủy và chặn đứng tia nổ không lan tiếp. |

---

## 6. DANH SÁCH PROPOSED DESIGNS CÒN CHỜ USER PHÊ DUYỆT

Toàn bộ 10 vấn đề thiết kế mở dưới đây **CHƯA ĐƯỢC TỰ Ý COI LÀ ĐÃ PHÊ DUYỆT** và đang ở trạng thái `Proposed Design` chờ User / Tech Lead định hướng:

| ID | Vấn đề Thiết kế Mở | Phương án Architect Đề xuất | Lý do & Căn cứ Đề xuất |
| :---: | :--- | :--- | :--- |
| **OD-01** | Ngữ nghĩa bán kính `blastPower = 1` | **Phương án A**: `power = 1` sinh chữ thập 5 ô (1 tâm + 4 cánh 1 ô). | Phù hợp chuẩn Bomberman cổ điển và mô tả tại [PRD US-02](file:///C:/Git/Bomber/Bomber/Agents/PRODUCT_REQUIREMENTS.md#us-02-%C4%91%E1%BA%B7t-bom-v%C3%A0-k%C3%ADch-ho%E1%BA%A1t-v%E1%BB%A5-n%E1%BB%95) & [GDD 3.3](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#33-v%E1%BB%A5-n%E1%BB%95--tia-l%E1%BB%ADa-explosion--blast-waves). |
| **OD-02** | Thời điểm phá hủy Gạch mềm | **Phương án A**: Ô gạch chuyển ngay thành `EMPTY` tại $t=0\text{s}$ trên logic; hoạt ảnh vỡ vụn 0.3s tách biệt ở tầng visual. | Giữ logic Headless đơn giản, không cần thêm trạng thái `BRICK_CRUMBLING` vào `TileType`. |
| **OD-03** | Hành vi Cửa Thoát hiểm ẩn | **Phương án A**: Lộ diện thành `EXIT_DOOR_LOCKED`, là khối bất tử và không cản tia lửa (`blocksBlast = false`). | Bảo đảm tia nổ quét qua cửa không bị khựng lại, chuẩn bị cho Stage 4. |
| **OD-04** | Cửa sổ miễn nhiễm cho Power-Up mới rơi | **Phương án A**: Cấp cửa sổ miễn nhiễm $0.4\text{s}$ đối với vụ nổ hiện tại vừa phá gạch. | Tránh người chơi bị ức chế vì mất item oan ngay khi vừa phá gạch. |
| **OD-05** | Khử trùng lặp gạch mềm vỡ khi nhiều vụ nổ chạm vào | **Phương án A**: Dùng atomic boolean return của `gridSystem.destroySoftWall()`, chỉ frame đầu trả về `true` bắn `BLOCK_DESTROYED`. | Ngăn chặn triệt để duplicate item drop và tính điểm đúp. |
| **OD-06** | Thời lượng Bất tử của Player (i-frames) | **Phương án A**: $2.0\text{s}$ kèm Alpha Blinking $0.1\text{s}$ sau khi hồi sinh. | Trải nghiệm arcade chuẩn mực theo [GDD Mục 3.1](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#31-nh%C3%A2n-v%E1%BA%ADt-bomber-player). |
| **OD-07** | Player bước vào ô đang có lửa | **Phương án A**: Nhận sát thương ngay lập tức nếu không có i-frames. | Trực quan, phản ánh đúng tính nguy hiểm của ô lửa theo [GDD Mục 3.3](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#33-v%E1%BB%A5-n%E1%BB%95--tia-l%E1%BB%ADa-explosion--blast-waves). |
| **OD-08** | **Thời lượng Sát thương vs Thời lượng Thị giác (DT-01)** | **Phương án A**: Hitbox sát thương và visual tồn tại đồng nhất đúng $0.4\text{s}$. | Đề xuất theo [GDD Mục 3.3](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md#33-v%E1%BB%A5-n%E1%BB%95--tia-l%E1%BB%ADa-explosion--blast-waves) ("Hitbox hoạt động liên tục trong 0.4s"). Cần User phê chuẩn chính thức. |
| **OD-09** | Thứ tự Cập nhật Hệ thống | **Phương án A**: Pipeline 9 bước tại Mục 11, giải phóng ô bom trước khi Player di chuyển. | Triệt tiêu độ trễ 1 frame khi bom nổ giải phóng đường đi. |
| **OD-10** | Tính tất định trong thứ tự duyệt nhánh BFS | **Phương án A**: Cố định cứng mảng `['UP', 'DOWN', 'LEFT', 'RIGHT']`. | Bảo đảm tính tái lập 100% trong toàn bộ các Unit Tests và Snapshot Testing. |

---

## 7. DANH SÁCH ADR REFERENCES ĐÃ KIỂM TRA

Đã tiến hành rà soát tự động và thủ công trên toàn bộ kho lưu trữ:
- `ADR-001` đến `ADR-009`: Kiểm tra tính toàn vẹn (Boot, Preload, EventBus, State Machine).
- `ADR-010`: GameMap bất biến & PRNG Mulberry32 (Hợp lệ).
- `ADR-011`: Player Entity, Corner Sliding, Orthogonal Input (Hợp lệ).
- `ADR-012`: Kinematic Arcade Body & Corridor Entry Auto-Centering (Hợp lệ).
- `ADR-013`: Kiến trúc Phân hệ Bom & Vụ nổ (Gồm 3 Quyết định: Quyết định 1, Quyết định 2, Quyết định 3).
- **Kết quả kiểm tra phantom**:
  - Không còn bất kỳ tham chiếu nào tới `ADR-013.4`, `ADR-013.5`, `ADR-013.6`, `ADR-013.7` trong các bảng quy tắc hoặc ma trận kiểm thử.
  - Tệp [`Agents/DECISION_LOG.md`](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md) được **bảo toàn nguyên vẹn 100%** từ git HEAD, không bị chỉnh sửa, không có ADR mới nào được tự ý thêm vào.

---

## 8. DANH SÁCH TEST MATRIX ENTRIES ĐÃ HIỆU CHỈNH (35 UNIT TESTS)

Ma trận kiểm thử tại Mục 13 của [`Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md) được phân định nguồn gốc chính xác:

### 8.1. Nhóm Raycasting (`tests/ExplosionRaycaster.test.ts` - 17 tests)
1. `UT-RAY-01` (Power 1 Open Space): `[Approved Requirement - GDD 3.3 & PRD US-02]`
2. `UT-RAY-02` (Power 2 Open Space): `[Approved Requirement - GDD 3.3]`
3. `UT-RAY-03` (Power 3 Open Space): `[Approved Requirement - GDD 3.3]`
4. `UT-RAY-04` (Clamp Invalid Power): `[Proposed Design Test - Defensive Programming]`
5. `UT-RAY-05` (Out of Bounds Origin): `[Approved Requirement - ADR-010 GridMath]`
6. `UT-RAY-WALL-01` (Hard Wall Adjacent): `[Approved Requirement - GDD 3.3 & PRD US-02]`
7. `UT-RAY-WALL-02` (Hard Wall Distance 2): `[Approved Requirement - GDD 3.3]`
8. `UT-RAY-WALL-03` (Enclosed by 4 Walls): `[Approved Requirement - GDD 3.3]`
9. `UT-RAY-BRICK-01` (Soft Brick Adjacent): `[Approved Requirement - GDD 3.3 & PRD US-02]`
10. `UT-RAY-BRICK-02` (Soft Brick Blocks Ray): `[Approved Requirement - GDD 3.3 & PRD US-02]`
11. `UT-RAY-BRICK-03` (Multiple Soft Bricks): `[Approved Requirement - GDD 3.3]`
12. `UT-RAY-BRICK-04` (Raycaster Pure Query): `[Approved Requirement - GEMINI.md SRP]`
13. `UT-RAY-BOMB-01` (Detect Bomb Entity): `[Approved Requirement - ADR-013 Quyết định 2]`
14. `UT-RAY-BOMB-02` (Penetrate Bomb): `[Approved Requirement - ADR-013 Quyết định 2]`
15. `UT-RAY-BOMB-03` (Penetrate Multiple): `[Approved Requirement - ADR-013 Quyết định 2]`
16. `UT-RAY-BOUND-01` (Map Edge Blast): `[Approved Requirement - ADR-010 GridMath]`
17. `UT-RAY-BOUND-02` (Exit Door Penetration): `[Proposed Design Test - OD-03]`

### 8.2. Nhóm ExplosionSystem, Batch Processing & BFS (`tests/ExplosionSystem.test.ts` - 18 tests)
18. `UT-EXP-01` (Single Bomb Explode): `[Approved Requirement - ADR-013 Quyết định 1]`
19. `UT-EXP-02` (Countdown and Finish): `[Approved Requirement - GDD 3.3 & Roadmap Stage 3]`
20. `UT-EXP-03` (Destroy Soft Wall Grid): `[Approved Requirement - GDD 3.2 & PRD US-02]`
21. `UT-EXP-MULTI-EXPIRE` (Same Frame Expiration): `[Proposed Design Test - C2 Batch Processing]`
22. `UT-EXP-DEDUP-TRIGGER` (Duplicate Trigger Guard): `[Approved Requirement - ADR-013 Quyết định 2]`
23. `UT-EXP-OVERLAP` (Overlapping Cells): `[Approved Requirement - ADR-013 Quyết định 3]`
24. `UT-EXP-MULTI-BRICK` (Multi-blast on Brick): `[Proposed Design Test - OD-05]`
25. `UT-EXP-ALREADY-EXP` (Hit Exploding Bomb): `[Proposed Design Test - C2/C3]`
26. `UT-EXP-CLEANUP-LIFE` (Centralized Lifetime): `[Proposed Design Test - M3/M4]`
27. `UT-CHAIN-01` (Chain Reaction Adjacent): `[Approved Requirement - ADR-013 Quyết định 2]`
28. `UT-CHAIN-02` (Chain 5 Bombs Line): `[Approved Requirement - ADR-013 Quyết định 2]`
29. `UT-CHAIN-03` (Chain Loop 2x2): `[Approved Requirement - ADR-013 Quyết định 2]`
30. `UT-CHAIN-20-STRESS` (Stress Test 20 Bombs): `[Proposed Design Test - M1/M5 Head Index Queue]`
31. `UT-CHAIN-05` (Preserve Blast Power): `[Approved Requirement - ADR-013 Quyết định 2 & GDD 3.2]`
32. `UT-STACK-VISUAL` (Visual Aggregation): `[Proposed Design Test - M4 Aggregation Engine]`
33. `UT-EXP-MULTI-PLAYER` (Damage Multi-Player): `[Proposed Design Test - Minor 6]`
34. `UT-EXP-IFRAMES` (Invulnerability Window): `[Proposed Design Test - OD-06/OD-07]`
35. `UT-EXP-CLEANUP-IDEM` (Idempotent Cleanup): `[Proposed Design Test - Minor 4]`

**Tổng kết phân loại**:
- **Approved Requirement Tests**: **23 bài** (65.7%).
- **Proposed Design Tests**: **12 bài** (34.3%).

---

## 9. TỔNG HỢP KIỂM TOÁN GIT DIFF & MÃ NGUỒN (GIT DIFF SUMMARY)

```text
Working Directory: C:/Git/Bomber/Bomber
Git Status:
 M Agents/IMPLEMENTATION_ROADMAP.md
 M Agents/STAGE_3B_3A_1_REPORT.md
?? Agents/STAGE_3B_3A_2_REPORT.md
?? Agents/STAGE_3B_3A_REPORT.md
?? Agents/STAGE_3B_3A_TECHNICAL_AUDIT.md
?? Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md
```

- **Can thiệp mã nguồn**: **0 file** trong `src/` hoặc `tests/` bị thay đổi.
- **Can thiệp cấu hình**: **0 file** cấu hình dự án bị thay đổi.
- **Can thiệp văn bản pháp quy**: `Agents/DECISION_LOG.md` **hoàn toàn nguyên vẹn** (0 diff đối với git HEAD).
- **Git Commit**: **0 commit** mới được tạo.
- **Test Suite Thực tế**: `vitest run` $\to$ **140/140 tests PASS 100%** ($2.14\text{s}$).
- **Typecheck**: `tsc --noEmit` $\to$ **0 errors**.
- **Production Build**: `vite build` $\to$ **Thành công** ($6.42\text{s}$).

---

## 10. BẢNG ĐỐI CHIẾU TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA CHECKLIST)

- [x] **OD-08 không còn bị gắn nhãn Approved**: Đã chuyển thành `Proposed Design` trong cả `TECHNICAL_DESIGN.md` và `STAGE_3B_3A_1_REPORT.md`.
- [x] **Không còn tham chiếu ADR-013.6 hoặc ADR-013.7 không tồn tại**: Bãi bỏ 100% các ký hiệu phantom tự tạo.
- [x] **Tất cả Approved Requirement Tests đều trỏ tới nguồn phê duyệt có thật**: 23 bài test trỏ chính xác vào GDD 3.2, GDD 3.3, PRD US-02, ADR-010, ADR-012, ADR-013 (Quyết định 1, 2, 3).
- [x] **Proposed Design Tests được phân biệt rõ ràng**: 12 bài test đề xuất mang nhãn `[Proposed Design Test]`.
- [x] **Grid occupancy và Bomb entity lookup được mô tả riêng biệt**: Bảng phân định 5 khái niệm tại Mục 5.1 giải quyết rạch ròi.
- [x] **Bomb capacity và Grid cell được giải phóng đúng tại trạng thái EXPLODING theo ADR-013**: Giữ nguyên vẹn điều khoản của ADR-013 Quyết định 1.
- [x] **Complexity Analysis được giải thích là technical clarification**: Khối Alert Note tại Mục 5.5 giải thích rõ quan hệ giữa phát biểu kiến trúc đồ thị $O(N)$ và phân tích cụ thể hóa thao tác vật lý ô lưới $O(N \cdot P)$.
- [x] **ADR-013 được bảo toàn nguyên vẹn**: `DECISION_LOG.md` không bị thay đổi.
- [x] **Không có source code hoặc test code bị chỉnh sửa**: 0 dòng code `src/` hoặc `tests/` bị can thiệp.
- [x] **Git diff chỉ chứa file tài liệu được phép**: Chỉ gồm `Agents/*.md`.
- [x] **Revision Report phản ánh chính xác các thay đổi**: Toàn bộ 11 mục yêu cầu được trình bày minh bạch, đầy đủ bằng chứng.
- [x] **Stage 3B.3B vẫn ở trạng thái NOT AUTHORIZED / PENDING APPROVAL**: Nghiêm cấm triển khai code khi chưa có phê duyệt.

---

## 11. CÁC VẤN ĐỀ CÒN TỒN TẠI VÀ ĐỀ XUẤT BƯỚC TIẾP THEO

### 11.1. Các vấn đề chờ User / Tech Lead quyết định:
1. Phê chuẩn chính thức tài liệu thiết kế kỹ thuật [`Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md) (v1.2.0).
2. Lựa chọn định hướng chính thức cho 10 đề xuất trong [Sổ Đăng ký Quyết định Mở (OD-01 đến OD-10)](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#14-s%E1%BB%95-%C4%91%C4%83ng-k%C3%BD-quy%E1%BA%BFt-%C4%91%E1%BB%8Bnh-m%E1%BB%9F-open-decisions-register---x%E1%BB%AD-l%C3%BD-c4), đặc biệt là:
   - `OD-01`: Xác nhận bán kính `blastPower = 1` sinh 5 ô hình chữ thập.
   - `OD-08`: Xác nhận thời lượng hitbox sát thương tồn tại đồng nhất đúng $0.4\text{s}$ cùng visual.
3. Cấp thẩm quyền chính thức để bắt đầu triển khai mã nguồn **Stage 3B.3B (Explosion Core Logic & BFS Chain Reaction Implementation)**.

### 11.2. Kết luận Trạng thái Quản trị:
**`TRACEABILITY CORRECTION COMPLETED – READY FOR INDEPENDENT REVIEW`**

> [!CAUTION]
> **ĐIỂM DỪNG PHÊ DUYỆT (HALT & APPROVAL GATE)**:  
> Senior Developer & Software Architect **DỪNG LẠI TẠI ĐÂY (HALT)**. Tuyệt đối không triển khai mã nguồn, không tạo test code, không bắt đầu Stage 3B.3B, không tự phê duyệt quyết định nghiệp vụ thay User, và không thực hiện Git commit cho đến khi nhận được chỉ thị văn bản chính thức từ User / Tech Lead.
