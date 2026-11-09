# BÁO CÁO KỸ THUẬT NGHIỆM THU STAGE 3B.3A.4
## FINAL GOVERNANCE & TECHNICAL CONSISTENCY CORRECTION REPORT (VERSION 1.4.0)

> **Dự án**: Bomber Game (Classic Bomberman Remake - Phaser 3 + TypeScript + Vite)  
> **Giai đoạn**: **Stage 3B.3A.4 – Final Governance & Technical Consistency Correction**  
> **Người thực hiện**: Senior Game Developer & Software Architect (DeepMind Team)  
> **Tài liệu chuẩn hóa chính**: [`Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md) (**Version 1.4.0**)  
> **Tài liệu tiến độ cập nhật**: [`Agents/IMPLEMENTATION_ROADMAP.md`](file:///C:/Git/Bomber/Bomber/Agents/IMPLEMENTATION_ROADMAP.md)  
> **Văn bản pháp quy được bảo toàn**: [`Agents/DECISION_LOG.md`](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md) (ADR-001 đến ADR-013 nguyên vẹn 100%)  
> **Kết luận nghiệm thu**: **`STAGE 3B.3A.4 COMPLETED — READY FOR INDEPENDENT REVIEW`**  
> **Trạng thái Stage 3B.3B**: **`STRICTLY NOT AUTHORIZED / PENDING APPROVAL`**  

---

## 1. EXECUTIVE SUMMARY

### 1.1. Mục đích của Stage 3B.3A.4
Phiên làm việc **Stage 3B.3A.4** được kích hoạt theo chỉ thị quản trị của User / Tech Lead nhằm xử lý dứt điểm các điểm chưa đạt trong đợt Independent Review đối với bản Technical Design v1.3.0. Mục tiêu tối hậu là hoàn thiện tính nhất quán kỹ thuật tuyệt đối và tuân thủ chặt chẽ khuôn khổ Governance trước khi trình User nghiệm thu lần cuối.

Các trọng tâm cốt lõi được giải quyết:
1. **Xác lập Single Source of Truth (SSOT) cho Vòng đời Sát thương và Thị giác (DT-05)**: Phân định rõ cấp thẩm quyền dữ liệu duy nhất (`IExplosionData`), loại bỏ dữ liệu trùng lặp trong `IExplosionContribution`, phân định rạch ròi 3 API (`isDamageActiveAt`, `isVisualActiveAt`, `isExplosionAt`), và ghi nhận GDD 3.3 là baseline requirement hiện hành.
2. **Chuẩn hóa Trình tự 12 Thao tác & Phân định Event Ordering cho Bomb Lifecycle (DT-06)**: Trả lời cặn kẽ 12 câu hỏi về chu trình sống của quả bom, chuẩn hóa trình tự phát event và loại bỏ triệt để việc phát event hoàn tất ở thời điểm bắt đầu nổ, giải thích cơ chế boolean guards bảo đảm tính Idempotent 100%.
3. **Phân biệt Requirement Hiện hành và Đề xuất Thay đổi cho `blastPower` (DT-07)**: Ghi nhận OD-01 Phương án A là cách triển khai khớp 100% với Approved Baseline Requirement của GDD 3.3 và PRD US-02; ghi nhận Phương án B là Proposed Change cần User phê duyệt; định nghĩa rõ `blastPower` là bán kính ray mở rộng không tính ô tâm.
4. **Bảo tồn Tuyệt đối Quy trình 10 Bước Chuẩn Tắc (DT-08)**: Giữ nguyên vẹn quy trình 10 bước đã được nghiệm thu đạt, bảo đảm không phát sinh regression.
5. **Phân rã Minh bạch Khung Quản trị 4 Nhóm Trạng thái (DT-09)**: Giữ nguyên 4 nhóm trạng thái của Governance, phân rã nhóm Approved thành 6 Approved Architectural Decisions (ADR) và 5 Approved Product Requirements (GDD/PRD) rõ ràng, không gộp chung gây hiểu lầm thống kê.
6. **Bổ sung Bằng chứng Git & Hash SHA-256 cho Untracked Files (DT-10)**: Thu thập đầy đủ 5 lệnh Git (stat, name-status, cached), kiểm tra hash SHA-256 trước/sau cho các untracked files để chứng minh tính toàn vẹn 0-code-change; nêu rõ giới hạn kiểm chứng thực tế.
7. **Khắc phục Mâu thuẫn trong Phần Quản lý Rủi ro (Mục 13)**: Loại bỏ triệt để phát biểu "Agent tự ý chọn A làm mặc định", khẳng định tuân thủ baseline requirement của GDD 3.3 cho đến khi User duyệt đề xuất thay đổi.

### 1.2. Trạng thái Phiên bản Tài liệu
- **Tài liệu Thiết kế Kỹ thuật**: Nâng cấp chính thức từ **v1.3.0** lên **v1.4.0 (Final Architecture Specification)**.
- **Quyền hạn Stage 3B.3B**: Tiếp tục duy trì nghiêm ngặt trạng thái **`STRICTLY NOT AUTHORIZED / PENDING APPROVAL`**. Tuyệt đối không có hành động viết code triển khai.

---

## 2. GOVERNANCE VÀ GIỚI HẠN QUYỀN HẠN (COMPLIANCE BOUNDARIES)

Tuân thủ nghiêm ngặt chỉ thị tại [`GEMINI.md`](file:///C:/Git/Bomber/Bomber/GEMINI.md) và các quy định của phiên review:

1. **Zero-Code Verification**:
   - Khẳng định **0 dòng code** trong `src/`, `tests/`, `public/` hoặc các file cấu hình dự án (`package.json`, `tsconfig.json`, `vite.config.ts`) bị thay đổi hoặc tạo mới.
   - Không viết code gameplay, không tạo hoặc chạy test, không cài đặt package, không thực hiện `git add`, `git commit`, `git push` hoặc `git reset`.
2. **Bảo toàn Văn bản Pháp quy [`Agents/DECISION_LOG.md`](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md)**:
   - Giữ nguyên vẹn 100% nội dung ADR-001 đến ADR-013.
   - Không tự ý tạo ADR mới.
   - **Bảo toàn nguyên vẹn cả 3 quyết định nền tảng của ADR-013**:
     - *Quyết định 1: Spatial Disjoint AABB Pass-through, Capacity Refund & Grid Empty at EXPLODING.*
     - *Quyết định 2: Non-recursive BFS Chain Reaction & Penetrating Blast.*
     - *Quyết định 3: Cell-based Visual Stacking & State Contribution Tracking.*
3. **Quyền Hạn Đối với Proposed Designs**:
   - Giữ nguyên toàn bộ `OD-01` đến `OD-10` ở trạng thái **`Proposed Design`**.
   - Không tự ý phê duyệt, không tự ý chọn phương án thay User, không biến Proposed Design thành Approved Decision.

---

## 3. TÀI LIỆU ĐÃ KIỂM TRA THỰC TẾ (INSPECTED DOCUMENTS)

1. [`GEMINI.md`](file:///C:/Git/Bomber/Bomber/GEMINI.md):
   - Đọc kỹ Section 1 (Vai trò Agent), Section 2 (Nguyên tắc cốt lõi: SRP, No Monolithic Files, Strict Type-Safe, Event-Driven, Giới hạn MVP), Section 3 (Quy trình Approval Gates bắt buộc), Section 5 (Dos & Don'ts).
2. [`Agents/DECISION_LOG.md`](file:///C:/Git/Bomber/Bomber/Agents/DECISION_LOG.md):
   - Đọc nguyên văn ADR-008 (Tile Grid Matrix), ADR-011 (Grid Coordinate & Tile Math), ADR-012 (Kinematic Sensor Player Hitbox $28\times 28$), ADR-013 (Quyết định 1, 2, 3).
3. [`Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md):
   - Rà soát toàn bộ 14 đề mục thiết kế kỹ thuật từ v1.3.0 và tiến hành nâng cấp lên **v1.4.0**.
4. [`Agents/STAGE_3B_3A_REPORT.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_REPORT.md) & [`Agents/STAGE_3B_3A_3_REPORT.md`](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_3_REPORT.md):
   - Kiểm tra các nội dung đã ghi nhận ở các vòng hiệu chỉnh trước để loại bỏ mâu thuẫn và giữ tính lịch sử.
5. [`Agents/IMPLEMENTATION_ROADMAP.md`](file:///C:/Git/Bomber/Bomber/Agents/IMPLEMENTATION_ROADMAP.md):
   - Đọc các tiêu chí nghiệm thu Stage 3B.1, 3B.2, 3B.3A; cập nhật ghi nhận Stage 3B.3A.4 ở trạng thái PENDING REVIEW.
6. [`Agents/PRODUCT_REQUIREMENTS.md`](file:///C:/Git/Bomber/Bomber/Agents/PRODUCT_REQUIREMENTS.md):
   - Đọc nguyên văn User Story `US-02` về cơ chế bom nổ hình chữ thập mặc định 1 ô, phá gạch mềm và kích nổ nổ dây chuyền bom lân cận.
7. [`Agents/GAME_DESIGN_DOCUMENT.md`](file:///C:/Git/Bomber/Bomber/Agents/GAME_DESIGN_DOCUMENT.md):
   - Đọc nguyên văn Mục 2.2 (Perimeter Border), Mục 3.1 (Player lives, hitbox), Mục 3.2 (Bomb fuse 3.0s, pass-through), Mục 3.3 (Vụ nổ chữ thập, thời lượng 0.4s, va chạm liên tục, gộp visual stacking), Mục 4 (Fire Up tối đa 6 ô), Mục 6 (Cửa thoát hiểm).
8. [`src/systems/GridSystem.ts`](file:///C:/Git/Bomber/Bomber/src/systems/GridSystem.ts) & [`src/systems/BombSystem.ts`](file:///C:/Git/Bomber/Bomber/src/systems/BombSystem.ts):
   - Đối chiếu chữ ký phương thức thực tế `getTile(coord): TileType | null` và `getBombAt(coord): IBombData | null`.
9. [`src/types/Event.types.ts`](file:///C:/Git/Bomber/Bomber/src/types/Event.types.ts) & [`src/core/GameEvents.ts`](file:///C:/Git/Bomber/Bomber/src/core/GameEvents.ts):
   - Kiểm tra danh mục sự kiện hiện hữu: `BOMB_TRIGGERED`, `BOMB_EXPLODING`, `BOMB_EXPLODED`, `BOMB_FINISHED`.

---

## 4. CHI TIẾT HIỆU CHỈNH DT-05 (DAMAGE LIFETIME VÀ VISUAL LIFETIME)

### 4.1. Thông Tin Finding
- **Finding ID**: `DT-05`
- **Mức độ**: Critical
- **Vấn đề ban đầu**:
  Trong Technical Design v1.3.0, cả `IExplosionData` và `IExplosionContribution` đều chứa 2 biến `damageRemainingTime` và `visualRemainingTime`. Điều này dẫn đến sự không rõ ràng về Single Source of Truth: cấp nào là dữ liệu thẩm quyền? Nếu 2 cấp cùng lưu thì cơ chế đồng bộ ra sao? Đồng thời, định nghĩa `isExplosionAt()` bị mô tả mâu thuẫn giữa Mục 8.1 (ủy quyền cho damage) và Mục 12.3 (ủy quyền cho visual).
- **Nguyên nhân**:
  Tách 2 biến thời lượng ở mức interface nhưng chưa làm rõ vai trò Authoritative Master vs Derived Query, dẫn đến trùng lặp dữ liệu không cần thiết và tiềm ẩn rủi ro desync.

### 4.2. Nội dung Đã Hiệu Chỉnh trong Technical Design v1.4.0
1. **Xác lập Single Source of Truth (SSOT)**:
   - `IExplosionData` là **Authoritative Master State duy nhất** lưu trữ `damageRemainingTime: number` và `visualRemainingTime: number`.
   - `IExplosionContribution` **loại bỏ hoàn toàn các biến đếm lùi trùng lặp**, chỉ lưu `readonly explosionId: string` để trỏ về Master `IExplosionData`. Mọi truy vấn trạng thái tại ô lưới đều là **Derived Query** tra cứu từ Master thông qua `explosionId`.
2. **Định nghĩa 4 Trạng thái Vòng đời Contribution**:
   - *Damage Active & Visual Active*: Master `damageRemainingTime > 0` và `visualRemainingTime > 0` $\implies$ Ô lưới gây sát thương và hiển thị ngọn lửa.
   - *Damage Expired nhưng Visual Active (Smoke Phase - nếu User duyệt OD-08 PA B)*: Master `damageRemainingTime <= 0` nhưng `visualRemainingTime > 0` $\implies$ Ô lưới không còn gây sát thương (`isDamageActiveAt === false`), người chơi bước vào ô an toàn.
   - *Visual Expired*: Master `visualRemainingTime <= 0` $\implies$ Kết thúc vụ nổ.
   - *Contribution Removal & Cell Cleanup*: Xóa contribution khỏi ô lưới. Nếu ô còn contribution từ vụ nổ khác, gọi `recomputeCellVisualShape` để cập nhật sprite và duy trì sát thương (nếu còn vụ nổ có `damageRemainingTime > 0`). Nếu ô không còn contribution nào, xóa ô khỏi `cellExplosionMap`.
   - *Explosion Completion*: Khi `visualRemainingTime <= 0`, phát `EXPLOSION_FINISHED`, xóa khỏi `activeExplosions`, gọi `bombSystem.finishBomb(bombId)`.
3. **Phân định 3 API Chuẩn tắc**:
   - `isDamageActiveAt(coord)`: API chuyên trách cho **Gameplay Hazard Overlap Detection**. Kiểm tra xem có ít nhất 1 vụ nổ bao phủ ô có `damageRemainingTime > 0`.
   - `isVisualActiveAt(coord)`: API chuyên trách cho **Hiển thị Render & VFX**.
   - `isExplosionAt(coord)`: Phương thức tương thích ngược, **ủy quyền 100% sang `isVisualActiveAt(coord)`**. **Nghiêm cấm Gameplay gọi `isExplosionAt`** để trừ mạng Player!
4. **Phân biệt Requirement Hiện hành và OD-08**:
   - GDD Mục 3.3 quy định thời gian tồn tại tia lửa 0.4s và hitbox hoạt động liên tục trong 0.4s $\implies$ Đây là **Approved Baseline Requirement** (tương ứng OD-08 Phương án A).
   - OD-08 Phương án B (damage 0.2s, visual 0.4s) là **Proposed Change** nhằm cải thiện cảm giác né đòn và cần User phê chuẩn. Không mô tả A và B như hai cách diễn giải ngang hàng; hệ thống tuân thủ baseline requirement của GDD 3.3 cho đến khi User duyệt B.

### 4.3. Bằng chứng Kiểm chứng
- **Vị trí tài liệu**: [Mục 8.1](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#81-đánh-giá-requirement-gdd-33-single-source-of-truth--phân-tách-độc-lập-damagevisual-xử-lý-dt-05--m3), [Mục 9.2](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#92-kiểm-tra-va-chạm-sát-thương-hazard-overlap), [Mục 12.1](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#121-cấu-trúc-kiểu-vụ-nổ-srctypesexplosiontypests), [Mục 14.2 (OD-08)](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#142-sổ-đăng-ký-đề-xuất-thiết-kế-proposed-designs-register-od-01---od-10).
- **Trạng thái**: **RESOLVED**.

---

## 5. CHI TIẾT HIỆU CHỈNH DT-06 (CANONICAL BOMB LIFECYCLE VÀ EVENT ORDERING)

### 5.1. Thông Tin Finding
- **Finding ID**: `DT-06`
- **Mức độ**: Critical
- **Vấn đề ban đầu**:
  Cần làm rõ trình tự thao tác giữa `transitionToTriggered()`, phát event `BOMB_TRIGGERED`, enqueue BFS, dequeue, `transitionToExploding()`, phát event `BOMB_EXPLODING`, phát event hoàn tất vụ nổ, và `finishBomb()`. Đặc biệt, không được phát event mang ý nghĩa hoàn tất ở thời điểm bắt đầu nổ.
- **Nguyên nhân**:
  Sự pha trộn giữa mã sự kiện `BOMB_EXPLODING` và `BOMB_EXPLODED` kế thừa từ Stage 3B.1 gây hiểu lầm về mặt ngữ nghĩa thời điểm.

### 5.2. Nội dung Đã Hiệu Chỉnh trong Technical Design v1.4.0
Ban hành bảng giải đáp chính xác và đầy đủ **12 câu hỏi vòng đời** tại [Mục 3.3](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#33-giải-đáp-chi-tiết-12-câu-hỏi-cốt-lõi-về-bomb-lifecycle--event-ordering-dt-06-analysis):

| STT | Câu hỏi Kỹ thuật | Trình tự & Thao tác Thực thi Chuẩn tắc trong v1.4.0 |
| :---: | :--- | :--- |
| 1 | **Khi nào bomb đổi từ `ARMED` sang `TRIGGERED`?** | • Fuse tự nhiên: trong `BombSystem.update()`, khi `remainingFuse <= 0`.<br/>• Nổ dây chuyền: khi Raycaster quét trúng bom kề cận `ARMED`, gọi `bombSystem.explodeImmediately(id)`. |
| 2 | **Khi nào phát `BOMB_TRIGGERED`?** | Phát ngay sau khi chuyển `ARMED -> TRIGGERED` thành công, **trước khi** nạp vào hàng đợi BFS. |
| 3 | **Khi nào bomb được enqueue?** | Ngay sau khi phát `BOMB_TRIGGERED`, bom được nạp vào BFS queue (`queue.push(bomb)`). |
| 4 | **Nếu enqueue thất bại hoặc bomb đã xử lý thì sao?** | Atomic Guard chặn ngay từ đầu: `if (bomb.state !== 'ARMED') return null;`. Nếu bom đã ở `TRIGGERED`, `EXPLODING`, hoặc `FINISHED`, từ chối ngay, không phát event, không enqueue lặp. |
| 5 | **Khi nào bomb được dequeue?** | Trong vòng lặp BFS `while (head < queue.length)`, bom được lấy ra bằng `const currentBomb = queue[head++]`. |
| 6 | **Khi nào chuyển sang `EXPLODING`?** | Ngay khi dequeue bomb ra để xử lý raycast, gọi `transitionToExploding(currentBomb)`. |
| 7 | **Khi nào hoàn trả `bombCapacity`?** | Bên trong `transitionToExploding(bomb)`: gọi `owner.activeCount--`, bảo vệ bởi cờ boolean `!bomb.isCapacityReleased`. |
| 8 | **Khi nào giải phóng Grid cell thành `EMPTY`?** | Bên trong `transitionToExploding(bomb)`: gọi `gridSystem.setTile(coord, EMPTY)` và thu hồi pass-through. Tuân thủ 100% ADR-013 Quyết định 1. |
| 9 | **Khi nào phát `BOMB_EXPLODING`?** | Cuối hàm `transitionToExploding(bomb)` sau khi đã hoàn trả capacity và giải phóng ô lưới. Đây là sự kiện **BẮT ĐẦU PHA NỔ**. |
| 10 | **Khi nào phát event báo vụ nổ kết thúc?** | Trong `ExplosionSystem.update()`, khi `visualRemainingTime <= 0`, phát `EXPLOSION_FINISHED`. |
| 11 | **Khi nào gọi `finishBomb()`?** | Ngay sau khi phát `EXPLOSION_FINISHED`, gọi `bombSystem.finishBomb(bombId)`. |
| 12 | **Khi nào xóa bomb khỏi registry?** | Bên trong `finishBomb()`, bom chuyển sang `FINISHED`, phát `BOMB_FINISHED`, và xóa khỏi `bombsById` và `bombsByCoord`. |

### 5.3. Phân định Event Semantics & Idempotency
- **Event Semantics**:
  - `BOMB_TRIGGERED`: Kích nổ sớm (bắt đầu chu trình nổ).
  - `BOMB_EXPLODING`: Bắt đầu pha nổ trên sàn đấu (giải phóng ô lưới, hồi capacity).
  - `EXPLOSION_CREATED`: Khởi tạo thực thể vụ nổ và các phân đoạn visual.
  - `EXPLOSION_FINISHED`: Kết thúc thời lượng vụ nổ (0.4s).
  - `BOMB_FINISHED`: Khép lại và tiêu hủy thực thể quả bom khỏi registry.
  - Tuyệt đối không phát event hoàn tất ở thời điểm bắt đầu nổ.
- **Cơ chế Idempotency**:
  - Cờ boolean `bomb.isCapacityReleased`: bảo đảm capacity chỉ giảm đúng 1 lần.
  - State guards: `if (bomb.state !== 'ARMED') return;` và `if (bomb.state === 'EXPLODING') return;`.
  - Grid guard: kiểm tra `getTile(coord) === TileType.BOMB` trước khi set `EMPTY`.
  - Map deletion: `finishBomb()` chỉ thực hiện trên state `EXPLODING`.

### 5.4. Bằng chứng Kiểm chứng
- **Vị trí tài liệu**: [Mục 3.2, 3.3, 3.4, 3.5, 3.6, 3.7](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#3-vòng-đời-bomb-single-ownership--thống-nhất-bomb-lifecycle-xử-lý-c1--dt-06).
- **Trạng thái**: **RESOLVED**.

---

## 6. CHI TIẾT HIỆU CHỈNH DT-07 (BLASTPOWER REQUIREMENT VÀ IMPLEMENTATION SEMANTICS)

### 6.1. Thông Tin Finding
- **Finding ID**: `DT-07`
- **Mức độ**: Major
- **Vấn đề ban đầu**:
  Cần phân biệt rõ requirement hiện hành với đề xuất thay đổi requirement. Nếu GDD 3.3 và PRD US-02 đã quy định rõ mặc định lan 1 ô theo 4 hướng thì không được gọi đó là Open Decision. Cần định nghĩa rõ ngữ nghĩa `blastPower` (có tính ô tâm không, số segment tối đa trong không gian mở và môi trường có cản).

### 6.2. Nội dung Đã Hiệu Chỉnh trong Technical Design v1.4.0
1. **Trích dẫn Nguyên văn Tài liệu Thẩm quyền Gốc**:
   - PRD US-02: *"Khi bom nổ, tạo tia lửa hình chữ thập (mặc định lan 1 ô về 4 hướng)..."*
   - GDD Mục 3.3: *"Bán kính nổ (Blast Range): Mặc định: 1 ô theo 4 hướng (Tâm + Trên + Dưới + Trái + Phải)..."*
   - GDD Mục 4: *"Fire Up: Tăng tầm lan truyền của tia lửa nổ thêm +1 ô. Tối đa 6 ô."*
2. **Khẳng định Bản chất Governance của OD-01**:
   - **Phương án A (`blastPower = 1` sinh chữ thập 5 ô trong không gian mở)**: Là cách triển khai **khớp hoàn toàn 100% với Approved Baseline Requirement** của GDD 3.3 và PRD US-02.
   - **Phương án B (`blastPower = 1` chỉ có 1 ô tâm, `power = 2` mới lan 1 ô)**: Là **Proposed Change (Đề xuất Thay đổi Quy cách)**. Bắt buộc phải có User phê duyệt mới được áp dụng.
3. **Implementation Semantics**:
   - `blastPower` đại diện cho **bán kính lan truyền tối đa của từng tia lửa (ray distance)** mở rộng từ ô tâm theo từng hướng trực giao.
   - **Ô tâm (Center segment)**: Không tính vào giá trị của `blastPower`. Ô tâm luôn luôn được sinh tại `origin` (nếu hợp lệ).
   - Không gian mở hoàn toàn: $S_{\max} = 1 + 4 \times P$ ($P=1 \implies 5$, $P=2 \implies 9$, $P=3 \implies 13$).
   - Môi trường có vật cản: Hard Wall chặn hoàn toàn (0 segment trên tường); Soft Wall sinh segment phá gạch rồi dừng lại; Perimeter Border dừng an toàn $\implies S_{\text{actual}} \le 1 + 4 \times P$.
4. **Phân loại Test Matrix**:
   - `UT-RAY-01`, `UT-RAY-02`, `UT-RAY-03` kiểm tra đặc tính lan truyền $1 + 4 \times P$ trong không gian mở được phân loại chính xác: `[Approved Requirement - GDD 3.3 & PRD US-02]`.

### 6.3. Bằng chứng Kiểm chứng
- **Vị trí tài liệu**: [Mục 5.6](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#56-phân-định-rạch-ròi-giữa-requirement-gốc--đề-xuất-thay-đổi-bán-kính-blastpower-xử-lý-dt-07), [Mục 13.1](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#131-nhóm-raycasting-testsexplosionraycastertestts---17-tests), [Mục 14.2 (OD-01)](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#142-sổ-đăng-ký-đề-xuất-thiết-kế-proposed-designs-register-od-01---od-10).
- **Trạng thái**: **RESOLVED**.

---

## 7. CHI TIẾT XỬ LÝ DT-08 (PIPELINE 10 BƯỚC CHUẨN TẮC)

### 7.1. Thông Tin Finding
- **Finding ID**: `DT-08`
- **Mức độ**: Minor (Đã đạt từ phiên review trước)
- **Yêu cầu**: Không mở lại finding đã đạt, giữ nguyên cấu trúc 10 bước chuẩn tắc, bảo đảm không gây regression.

### 7.2. Kết quả Rà soát
- Quy trình 10 bước chuẩn tắc trong `GameScene.update()` được bảo toàn nguyên vẹn 100%:
  1. Chuẩn hóa Delta Time
  2. Đọc Input
  3. Kích hoạt Đặt Bom
  4. Cập nhật Fuse Bom
  5. Kích hoạt Mẻ Vụ Nổ Batch
  6. Cập nhật Thời lượng Vụ Nổ
  7. Cập nhật Di chuyển Nhân vật
  8. Kiểm tra Sát thương Vụ Nổ (`isDamageActiveAt`)
  9. Cập nhật Quyền Đi Xuyên
  10. Đồng bộ Hiển thị & Audio Triggers
- Sơ đồ Mermaid tại [Mục 10](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#10-tích-hợp-hệ-thống-bombsystem-gridsystem-eventbus--gamescene), text [Mục 11](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#11-thứ-tự-cập-nhật-xác-định-trong-vòng-lặp-game-deterministic-pipeline-order) và [Mục 14.2 (OD-09)](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#142-sổ-đăng-ký-đề-xuất-thiết-kế-proposed-designs-register-od-01---od-10) hoàn toàn nhất quán.
- **Trạng thái**: **RESOLVED (MAINTAINED)**.

---

## 8. CHI TIẾT HIỆU CHỈNH DT-09 (GOVERNANCE CLASSIFICATION)

### 8.1. Thông Tin Finding
- **Finding ID**: `DT-09`
- **Mức độ**: Major
- **Vấn đề ban đầu**:
  Technical Design v1.3.0 đưa cả ADR và GDD/PRD vào chung nhóm `Approved Decision` và ghi nhận con số tổng 10 mục. Đây là hai loại thông tin khác nhau về bản chất (ADR là quyết định kiến trúc, PRD/GDD là yêu cầu sản phẩm/gameplay). Không được đồng nhất chúng chỉ để tạo con số tổng.

### 8.2. Nội dung Đã Hiệu Chỉnh trong Technical Design v1.4.0
Giữ nguyên 4 nhóm trạng thái chính thức theo [`GEMINI.md`](file:///C:/Git/Bomber/Bomber/GEMINI.md), đồng thời phân rã minh bạch nhóm Approved thành 2 phân loại con:

1. **Nhóm 1: Approved Decision**:
   - **1.1. Approved Architectural Decisions (ADR)** *(6 quyết định kiến trúc có thẩm quyền trong `DECISION_LOG.md`)*:
     - `ADR-008`: Tile Grid Matrix & Static Storage.
     - `ADR-011`: Grid Coordinate & Tile Math ($48\times 48$).
     - `ADR-012`: Kinematic Sensor Player Hitbox ($28\times 28$).
     - `ADR-013.D1`: Spatial Disjoint Pass-through, Capacity Refund & Grid Empty at `EXPLODING`.
     - `ADR-013.D2`: Non-recursive BFS Chain Reaction & Penetrating Blast.
     - `ADR-013.D3`: Cell-based Visual Stacking & State Contribution Tracking.
   - **1.2. Approved Product Requirements (PRD/GDD)** *(5 yêu cầu gameplay có thẩm quyền trong PRD & GDD)*:
     - `PRD-US-02`: Đặt bom phím Space, nổ dây chuyền bom lân cận, tia nổ chữ thập mặc định 1 ô.
     - `GDD-3.1`: Player 3 mạng, hitbox $28\times 28$, góc bo (Corner Sliding).
     - `GDD-3.2`: Bomb Fuse đếm lùi $3.0\text{s}$, đặt bom tại tâm ô lưới.
     - `GDD-3.3-Range`: Tầm nổ chữ thập mặc định 1 ô 4 hướng ($1+4\times P$ không gian mở); Hard Wall chặn tia; Soft Wall bị phá và chặn tia.
     - `GDD-3.3-Duration`: Thời gian tồn tại tia lửa chuẩn $0.4\text{s}$, hitbox quét va chạm liên tục trong 0.4s.
   - *(Tổng cộng: 6 ADRs + 5 Requirements = 11 Approved Items, phân định rõ ràng từng nguồn)*.
2. **Nhóm 2: Proposed Design**: **10 mục** (`OD-01` đến `OD-10`).
3. **Nhóm 3: Temporary Assumption**: **1 mục** (`TA-01`: Mocking Item & Exit Door trong Stage 3B headless tests).
4. **Nhóm 4: Open Decision**: **0 mục** (Toàn bộ 10 vấn đề kỹ thuật của Stage 3B đều đã có đề xuất cụ thể OD-01..OD-10).

### 8.3. Bằng chứng Kiểm chứng
- **Vị trí tài liệu**: [Mục 14.1](file:///C:/Git/Bomber/Bomber/Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md#141-khung-quản-trị-4-nhóm-trạng-thái-kỹ-thuật-governance-state-framework---xử-lý-dt-09).
- **Trạng thái**: **RESOLVED**.

---

## 9. CHI TIẾT HIỆU CHỈNH DT-10 (GIT EVIDENCE VÀ CHANGE SCOPE)

### 9.1. Thông Tin Finding
- **Finding ID**: `DT-10`
- **Mức độ**: Major
- **Vấn đề ban đầu**:
  `git diff --stat` không thể hiện thay đổi bên trong file untracked. Pre/post status giống nhau không đủ chứng minh các file untracked không thay đổi. Cần thu thập đầy đủ 5 lệnh Git, kiểm tra staged diff, và bổ sung phương pháp kiểm chứng cho file untracked (SHA-256). Nêu rõ giới hạn kiểm chứng.

### 9.2. Bằng Chứng Git Thực Tế Trước Khi Chỉnh Sửa (Pre-edit Git Evidence)
```bash
$ git status --short
 M Agents/IMPLEMENTATION_ROADMAP.md
?? Agents/STAGE_3B_3A_1_REPORT.md
?? Agents/STAGE_3B_3A_2_REPORT.md
?? Agents/STAGE_3B_3A_3_REPORT.md
?? Agents/STAGE_3B_3A_REPORT.md
?? Agents/STAGE_3B_3A_TECHNICAL_AUDIT.md
?? Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md

$ git diff --stat
 Agents/IMPLEMENTATION_ROADMAP.md | 56 +++++++++++++++++++++++++++++++++++++---
 1 file changed, 52 insertions(+), 4 deletions(-)

$ git diff --name-status
M       Agents/IMPLEMENTATION_ROADMAP.md

$ git diff --cached --stat
(Trống - Không có file nào được staged)

$ git diff --cached --name-status
(Trống - Không có file nào được staged)
```

**Bảng Hash SHA-256 Ban Đầu Của Các File Untracked Trước Chỉnh Sửa**:
| Đường dẫn File Untracked | Hash SHA-256 Trước Khi Sửa |
| :--- | :--- |
| `Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md` | `7E5B595DA0986DB31CF836875E0B1287B13339FD78BF2B1B7B300BA88263F22D` |
| `Agents/STAGE_3B_3A_3_REPORT.md` | `A42D576481BF5C54DEC613B62F7B99135210719E593DC0AAF471584A46D1F613` |
| `Agents/STAGE_3B_3A_REPORT.md` | `5A9D5B9536CA33F404F90D3855393875673B5F292B5B0034B50EFD481C9288C2` |
| `Agents/DECISION_LOG.md` (Tracked) | `8EC4D0C81F7FBF4BC94B960BA81113018CC1F659068DD38298EF13EBA8E9EA1E` |

### 9.3. Bằng Chứng Git Thực Tế Sau Khi Chỉnh Sửa (Post-edit Git Evidence)
```bash
$ git status --short
 M Agents/IMPLEMENTATION_ROADMAP.md
?? Agents/STAGE_3B_3A_1_REPORT.md
?? Agents/STAGE_3B_3A_2_REPORT.md
?? Agents/STAGE_3B_3A_3_REPORT.md
?? Agents/STAGE_3B_3A_4_REPORT.md
?? Agents/STAGE_3B_3A_REPORT.md
?? Agents/STAGE_3B_3A_TECHNICAL_AUDIT.md
?? Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md

$ git diff --stat
 Agents/IMPLEMENTATION_ROADMAP.md | 68 +++++++++++++++++++++++++++++++++++++---
 1 file changed, 64 insertions(+), 4 deletions(-)

$ git diff --name-status
M       Agents/IMPLEMENTATION_ROADMAP.md

$ git diff --cached --stat
(Trống - Tuân thủ tuyệt đối không tự ý git add)

$ git diff --cached --name-status
(Trống - Tuân thủ tuyệt đối không tự ý git add)
```

**So Sánh Hash SHA-256 Sau Khi Chỉnh Sửa**:
| Đường dẫn File | Hash SHA-256 Trước | Hash SHA-256 Sau | Kết Quả So Sánh |
| :--- | :--- | :--- | :---: |
| `Agents/STAGE_3B_3A_TECHNICAL_DESIGN.md` | `7E5B595D...` | `E94DF1FB969B86D0BB9F26C58B4D3BE2D4ED18B1341F4B4B2CD0394D38623999` | **Đã nâng cấp lên v1.4.0** |
| `Agents/STAGE_3B_3A_4_REPORT.md` | (Chưa tồn tại) | *(File deliverable mới tạo trong Stage 3B.3A.4)* | **Tạo mới Deliverable** |
| `Agents/STAGE_3B_3A_3_REPORT.md` | `A42D5764...` | `A42D576481BF5C54DEC613B62F7B99135210719E593DC0AAF471584A46D1F613` | **Giữ nguyên 100% (Trùng khớp)** |
| `Agents/STAGE_3B_3A_REPORT.md` | `5A9D5B95...` | `5A9D5B9536CA33F404F90D3855393875673B5F292B5B0034B50EFD481C9288C2` | **Giữ nguyên 100% (Trùng khớp)** |
| `Agents/DECISION_LOG.md` | `8EC4D0C8...` | `8EC4D0C81F7FBF4BC94B960BA81113018CC1F659068DD38298EF13EBA8E9EA1E` | **Giữ nguyên 100% (Trùng khớp)** |

### 9.4. Xác Nhận Phạm Vi Tuyệt Đối (Scope Verification)
- `git status --short src tests public package.json tsconfig.json vite.config.ts`: Trả về kết quả rỗng (0 dòng thay đổi).
- Toàn bộ thay đổi của Stage 3B.3A.4 chỉ nằm trong thư mục `Agents/` phục vụ công tác thiết kế tài liệu và báo cáo.

### 9.5. Giới Hạn Kiểm Chứng của Git (Git Limitations Disclosure)
- **Minh bạch kỹ thuật**: Lệnh `git diff` chỉ theo dõi các file đã được track bởi Git (`Agents/IMPLEMENTATION_ROADMAP.md`). Đối với các file untracked (`STAGE_3B_3A_TECHNICAL_DESIGN.md`, các báo cáo), Git diff không thể hiện nội dung thay đổi nội bộ. Do đó, việc sử dụng mã băm **SHA-256** là phương pháp bổ trợ độc lập bắt buộc để chứng minh tính toàn vẹn và phạm vi thay đổi thực tế.

**Trạng thái**: **RESOLVED**.

---

## 10. CHI TIẾT SỬA MỤC 13 (REMAINING RISKS & MITIGATION)

### 10.1. Vấn đề Ban đầu
Trong Báo cáo v1.3.0 Mục 13 ghi: *"Nếu User chưa chốt, hệ thống sẽ gán mặc định cả 2 bằng 0.4s (Phương án A)..."*. Phát biểu này mâu thuẫn trực tiếp với nguyên tắc tại Mục 4.3 rằng *"Agent không được tự ý lựa chọn phương án thay User"*.

### 10.2. Nội dung Đã Hiệu Chỉnh
1. **Khẳng định Bản chất**: Thời lượng sát thương $0.4\text{s}$ và visual $0.4\text{s}$ là **Approved Baseline Requirement** đã được phê duyệt chính thức trong GDD Mục 3.3.
2. **Loại bỏ Hoàn toàn Tuyên bố "Tự Ý Chọn Mặc Định"**:
   - Việc hệ thống hoạt động ở cấu hình 0.4s/0.4s khi chưa có quyết định mới là do **tuân thủ yêu cầu gốc đã được duyệt của GDD 3.3**, tuyệt đối không phải là do Agent tự ý chọn Phương án A.
   - Phương án B (damage 0.2s, visual 0.4s) là **Proposed Change**.
   - Bảng quản lý rủi ro được viết lại:
     | Rủi ro Kỹ thuật Tiềm ẩn | Mức độ | Kế hoạch Ứng phó Khi Bước Vào Stage 3B.3B |
     | :--- | :---: | :--- |
     | **User chưa có văn bản phê chuẩn OD-08 Phương án B** | Thấp | Hệ thống tuân thủ nghiêm ngặt **Approved Baseline Requirement của GDD 3.3** (thời lượng sát thương 0.4s, visual 0.4s). Cấu trúc mã nguồn đã được thiết kế modular độc lập 2 bộ đếm; nếu trong tương lai User phê chuẩn Phương án B, chỉ cần thay đổi cấu hình tham số mà không cần tái cấu trúc. |
     | **User phê chuẩn Phương án B cho OD-01 (`power=1` chỉ có tâm)** | Thấp | Mặc dù GDD 3.3 và PRD US-02 quy định mặc định lan 1 ô theo 4 hướng, nếu User quyết định thay đổi sang Phương án B, thuật toán Raycaster chỉ cần thay đổi điều kiện vòng lặp raycast `step <= power - 1` mà không ảnh hưởng tới kiến trúc raycasting. |
     | **Đồng bộ hóa Animation Phaser ở Stage 3B.4** | Thấp | Toàn bộ logic vụ nổ ở Stage 3B.3B là Headless thuần túy. Tầng Visual ở Stage 3B.4 chỉ cần lắng nghe sự kiện `EXPLOSION_CREATED` và `EXPLOSION_FINISHED` qua `EventBus` để sinh sprite và hủy sprite. |

**Trạng thái**: **RESOLVED**.

---

## 11. BẢNG TỔNG HỢP THAY ĐỔI TRONG TECHNICAL DESIGN v1.4.0

| Section trong v1.3.0 | Section trong v1.4.0 | Nội dung Thay đổi Cụ thể | Căn cứ & Lý do Thay đổi |
| :--- | :--- | :--- | :--- |
| **Tiêu đề & Revision** | **Tiêu đề & Revision** | Nâng cấp lên **Version 1.4.0**, ghi nhận hoàn tất toàn bộ các điểm kiểm toán DT-05 đến DT-10 và Mục 13. | Phản ánh chính xác phiên bản tài liệu nghiệm thu. |
| **Mục 1 & 2** | **Mục 1 & 2** | Cập nhật mục tiêu v1.4.0, đồng bộ ma trận truy xuất nguồn gốc. | Đồng bộ phiên bản. |
| **Mục 3.3** | **Mục 3.3** | Mở rộng từ 8 câu hỏi lên **12 câu hỏi chuẩn tắc** giải đáp chi tiết mọi khía cạnh vòng đời quả bom. | Xử lý triệt để **DT-06**. |
| **Mục 3.4 & 3.5** | **Mục 3.4 & 3.5** | Chuẩn hóa Event Ordering: `BOMB_TRIGGERED` -> Enqueue -> Dequeue -> `BOMB_EXPLODING` -> `EXPLOSION_CREATED` -> `EXPLOSION_FINISHED` -> `BOMB_FINISHED`. Loại bỏ hoàn toàn việc phát event hoàn tất ở thời điểm bắt đầu nổ. | Xử lý triệt để **DT-06**. |
| **Mục 3.6** | **Mục 3.6** | Trình bày chi tiết 5 cơ chế bảo đảm tính Idempotent 100% bằng boolean guards và state checks. | Xử lý triệt để **DT-06**. |
| **Mục 3.7** | **Mục 3.7** | Cập nhật Sequence Diagram thể hiện đầy đủ các bước enqueue, dequeue, event bắt đầu nổ và event kết thúc. | Xử lý triệt để **DT-06**. |
| **Mục 5.6** | **Mục 5.6** | Phân định rạch ròi: OD-01 PA A là triển khai theo Baseline Requirement của GDD 3.3 & PRD US-02; PA B là Proposed Change. Định nghĩa rõ `blastPower` là bán kính ray mở rộng không tính ô tâm. | Xử lý triệt để **DT-07**. |
| **Mục 8.1** | **Mục 8.1** | Thiết lập `IExplosionData` là Authoritative Master State (SSOT). Loại bỏ biến trùng lặp trong `IExplosionContribution`. Phân định rõ 4 trạng thái contribution lifecycle. Phân định rõ 3 API (`isDamageActiveAt`, `isVisualActiveAt`, `isExplosionAt`). | Xử lý triệt để **DT-05**. |
| **Mục 9.2** | **Mục 9.2** | Kiểm tra Hazard Overlap độc quyền sử dụng `isDamageActiveAt(coord)`, loại bỏ hoàn toàn `isExplosionAt()` khỏi gameplay hazard. | Xử lý triệt để **DT-05**. |
| **Mục 12.1** | **Mục 12.1** | Loại bỏ `damageRemainingTime` và `visualRemainingTime` khỏi interface `IExplosionContribution`, chỉ giữ tham chiếu `explosionId`. | Hoàn thiện Interface SSOT cho **DT-05**. |
| **Mục 13.1** | **Mục 13.1** | Dán nhãn `[Approved Requirement - GDD 3.3 & PRD US-02]` cho `UT-RAY-01..03` vì kiểm tra hành vi gốc đã duyệt của GDD 3.3. | Xử lý triệt để **DT-07**. |
| **Mục 14.1** | **Mục 14.1** | Giữ 4 nhóm Governance, phân rã nhóm Approved thành: 6 Approved Architectural Decisions (ADR) và 5 Approved Product Requirements (GDD/PRD). | Xử lý triệt để **DT-09**. |
| **Mục 14.2** | **Mục 14.2** | Cập nhật OD-01 và OD-08 ghi rõ Phương án A là Baseline Requirement, Phương án B là Proposed Change cần User duyệt. | Xử lý triệt để **DT-05, DT-07 & Mục 13**. |

---

## 12. NHỮNG ĐIỂM CHƯA GIẢI QUYẾT HOẶC CẦN USER QUYẾT ĐỊNH (ITEMS PENDING USER DECISION)

Theo đúng quy tắc quản trị tối cao: **"Technical Design hoàn chỉnh KHÔNG đồng nghĩa với việc các Proposed Designs đã được phê duyệt."** 

Dưới đây là bảng tổng hợp trung thực toàn bộ các nội dung hiện đang ở trạng thái chờ User / Tech Lead xem xét, quyết định hoặc phê duyệt trước khi Stage 3B.3B được phép triển khai vào mã nguồn:

### 12.1. Danh mục 10 Đề xuất Thiết kế (Proposed Designs: OD-01 -> OD-10) Chờ Phê Duyệt

| ID | Vấn đề Kỹ thuật | Trạng thái Hiện tại | Nội dung Cần User / Tech Lead Quyết định | Phương án Khuyến nghị (Baseline / Đề xuất) |
| :---: | :--- | :---: | :--- | :--- |
| **OD-01** | Ngữ nghĩa bán kính `blastPower = 1` | **Chờ Phê duyệt** | Lựa chọn giữa giữ nguyên Baseline Requirement (PA A: chữ thập 5 ô theo GDD 3.3 & PRD US-02) hoặc chuyển sang Proposed Change (PA B: chỉ có ô tâm). | **Khuyến nghị giữ PA A** (tuân thủ baseline requirement hiện hành của GDD 3.3). PA B chỉ áp dụng nếu User phê chuẩn thay đổi quy cách. |
| **OD-02** | Thời điểm gạch mềm thành EMPTY trên Grid | **Chờ Phê duyệt** | Duyệt PA A (ô gạch thành `EMPTY` tại $t=0\text{s}$, hoạt ảnh vỡ 0.3s tách biệt ở tầng render) hay PA B (ô gạch giữ trạng thái cản trong 0.3s). | **Khuyến nghị PA A** nhằm bảo đảm headless gameplay đơn giản, chuẩn xác. |
| **OD-03** | Tính chất xuyên tia của Cửa thoát hiểm ẩn | **Chờ Phê duyệt** | Duyệt PA A (Cửa thoát hiểm bất tử `isDestructible=false` và không cản tia lửa `blocksBlast=false` theo GDD Mục 6) hay PA B. | **Khuyến nghị PA A**. |
| **OD-04** | Cửa sổ miễn nhiễm tia nổ cho Power-Up mới rơi | **Chờ Phê duyệt** | Duyệt PA A (Cấp $0.4\text{s}$ miễn nhiễm đối với vụ nổ vừa phá vỡ viên gạch che phủ) hay PA B (thiêu rụi tức thì). | **Khuyến nghị PA A** để tránh ức chế trải nghiệm người chơi. |
| **OD-05** | Atomic guard khử trùng lặp gạch vỡ khi nhiều vụ nổ chạm vào | **Chờ Phê duyệt** | Duyệt PA A (Chỉ vụ nổ đầu tiên phá gạch và bắn `BLOCK_DESTROYED`, các vụ nổ sau bỏ qua) hay PA B. | **Khuyến nghị PA A** để ngăn drop item trùng lặp và tính điểm đúp. |
| **OD-06** | Thời lượng Bất tử Player (i-frames) sau khi mất mạng | **Chờ Phê duyệt** | Duyệt PA A (2.0s bất tử kèm chớp nháy nhịp 0.1s) hay PA B (1.5s hoặc 3.0s). | **Khuyến nghị PA A** theo GDD Mục 3.1. |
| **OD-07** | Sát thương khi Player bước vào ô đang có lửa | **Chờ Phê duyệt** | Duyệt PA A (Sát thương tức thì nếu không có i-frames) hay PA B (có độ trễ 0.1s). | **Khuyến nghị PA A** nhằm phản ánh đúng độ nguy hiểm của vùng hazard. |
| **OD-08** | Tách biệt thời lượng Sát thương vs Thời lượng Thị giác | **Chờ Phê duyệt** | Lựa chọn giữa giữ nguyên Baseline Requirement (PA A: Sát thương 0.4s, Visual 0.4s theo GDD 3.3) hoặc chuyển sang Proposed Change (PA B: Sát thương 0.2s, Visual 0.4s). | **Khuyến nghị giữ PA A** (tuân thủ baseline requirement hiện hành của GDD 3.3). PA B chỉ áp dụng nếu User phê chuẩn thay đổi quy cách. |
| **OD-09** | Thứ tự Pipeline 10 bước chuẩn tắc trong game loop | **Chờ Phê duyệt** | Phê chuẩn thứ tự 10 bước cập nhật hệ thống tại Mục 11 của Technical Design v1.4.0. | **Khuyến nghị PA A**. |
| **OD-10** | Tính tất định trong thứ tự duyệt mảng hướng BFS | **Chờ Phê duyệt** | Cố định cứng mảng hướng duyệt `['UP', 'DOWN', 'LEFT', 'RIGHT']` để bảo đảm tính tất định 100% cho Unit Tests. | **Khuyến nghị PA A**. |

### 12.2. Giả định Kỹ thuật Tạm thời Cần Ghi Nhận (Temporary Assumption: TA-01)
- **ID**: `TA-01` (Item & Exit Door Mocking trong Headless Tests Stage 3B).
- **Trạng thái**: **Active**.
- **Nội dung cần ghi nhận**: Cơ chế rơi Item và Cửa thoát hiểm trong Stage 3B được mock/stub độc lập trong các test headless (như `UT-RAY-BOUND-02`) và sẽ được hiện thực hóa toàn diện tại Stage 4 theo Roadmap.

### 12.3. Tình trạng Quyết định Bỏ ngỏ Chưa có Phương án (Open Decisions)
- **Số lượng**: **0 mục**.
- Không có bất kỳ vấn đề kiến trúc hay logic trò chơi nào của Stage 3B bị bỏ lửng mà không có phân tích kỹ thuật và phương án đề xuất đi kèm.

### 12.4. Quyền Hạn Bắt Đầu Stage 3B.3B (Stage Authorization Gate)
- **Hiện trạng**: **`STRICTLY NOT AUTHORIZED / PENDING APPROVAL`**.
- **Điều kiện tiên quyết**: Agent **tuyệt đối không được bắt đầu viết code Stage 3B.3B** cho đến khi User hoàn tất Independent Review, phê chuẩn Technical Design v1.4.0 và ra chỉ thị chính thức bằng văn bản về việc lựa chọn/phê duyệt các Proposed Designs nêu trên.

---

## 13. BẢNG TỰ ĐỐI SOÁT CUỐI CÙNG (FINAL SELF-REVIEW CHECKLIST)

Trước khi dừng lại, Agent đã tự động đối soát toàn bộ 13 tiêu chí bắt buộc theo chỉ thị của Tech Lead:

- [x] **DT-05**: Single Source of Truth (`IExplosionData`) và hai lifetime được phân định độc lập, loại bỏ hoàn toàn biến trùng lặp trong `IExplosionContribution`.
- [x] **DT-05**: GDD 3.3 requirement hiện hành (0.4s/0.4s) và OD-08 Phương án B (Proposed Change 0.2s/0.4s) được phân loại chính xác, không mâu thuẫn.
- [x] **DT-06**: Canonical lifecycle duy nhất (`ARMED -> TRIGGERED -> EXPLODING -> FINISHED`).
- [x] **DT-06**: Event ordering chính xác (`BOMB_TRIGGERED` -> Enqueue -> Dequeue -> `BOMB_EXPLODING` -> `EXPLOSION_CREATED` -> `EXPLOSION_FINISHED` -> `BOMB_FINISHED`), không phát event hoàn tất ở thời điểm bắt đầu nổ.
- [x] **DT-06**: Side effects được bảo đảm tính Idempotent bằng các boolean guards cụ thể (`!isCapacityReleased`, state guards).
- [x] **DT-07**: `blastPower` requirement và implementation semantics được phân định rõ ràng (bán kính ray không tính ô tâm, $1+4\times P$ không gian mở vs $\le 1+4\times P$ có cản).
- [x] **DT-07**: OD-01 Phương án A khớp 100% với GDD/PRD; Phương án B là Proposed Change; không mâu thuẫn với GDD/PRD.
- [x] **DT-08**: Không gây regression, Pipeline 10 bước chuẩn tắc được giữ nguyên vẹn.
- [x] **DT-09**: Governance classification đúng nguồn: phân rã minh bạch 6 Approved Architectural Decisions (ADR) và 5 Approved Product Requirements (PRD/GDD) trong 4 nhóm Governance.
- [x] **DT-10**: Bằng chứng Git (5 lệnh) kết hợp mã băm SHA-256 cho untracked files có giới hạn kiểm chứng rõ ràng, trung thực.
- [x] **Mục 13**: Loại bỏ triệt để phát biểu "Agent tự ý chọn A làm mặc định", khẳng định tuân thủ baseline requirement của GDD 3.3.
- [x] **ADR-013**: Cả 3 quyết định nền tảng của ADR-013 được bảo toàn nguyên vẹn 100%, không bị sửa đổi.
- [x] **Zero Code Changes**: Không có bất kỳ thay đổi nào trong `src/`, `tests/`, `public/`, config files.
- [x] **Trạng thái Stage 3B.3B**: Tiếp tục duy trì nghiêm ngặt **`STRICTLY NOT AUTHORIZED / PENDING APPROVAL`**.

---

## 14. KẾT LUẬN CUỐI CÙNG (FINAL STATUS)

Căn cứ vào việc toàn bộ các Acceptance Criteria của Stage 3B.3A.4 đã được xử lý triệt để, có bằng chứng kiểm chứng cụ thể và không còn bất kỳ mâu thuẫn nội bộ nào:

```text
================================================================================
STAGE 3B.3A.4 COMPLETED — READY FOR INDEPENDENT REVIEW
Stage 3B.3B Status: STRICTLY NOT AUTHORIZED / PENDING APPROVAL
================================================================================
```

> [!CAUTION]
> **Tuyên bố Quản trị**:
> - Tài liệu này **KHÔNG** tự ghi nhận là "APPROVED" hay "ACCEPTED BY USER".
> - Tài liệu này **KHÔNG** tự chuyển Stage 3B.3B sang "AUTHORIZED".
> - Bản thiết kế kỹ thuật Version 1.4.0 hoàn chỉnh **KHÔNG ĐỒNG NGHĨA** với việc các Proposed Designs (`OD-01` đến `OD-10`) đã được phê duyệt.
> - **Chỉ duy nhất User / Tech Lead mới có thẩm quyền nghiệm thu và cấp phép cho stage tiếp theo.**

---

## 15. AGENT HALT

Theo đúng quy chuẩn quản trị tối cao tại Section 14 của chỉ thị:
1. **Dừng mọi hoạt động** (Agent Halt).
2. **Không triển khai code**.
3. **Không chạy test**.
4. **Không bắt đầu Stage 3B.3B**.
5. **Không tự tiếp tục sang stage khác**.
6. **Chờ User thực hiện Independent Review và đưa ra chỉ thị tiếp theo.**