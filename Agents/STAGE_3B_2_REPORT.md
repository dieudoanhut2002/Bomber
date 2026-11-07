# BÁO CÁO KỸ THUẬT HOÀN THÀNH STAGE 3B.2
## PLAYER BOMB PASS-THROUGH & INPUT INTEGRATION

> **Dự án**: Bomber Game (Classic Bomberman Remake)  
> **Phiên bản kiến trúc**: v0.1.0 (Stage 3B.2)  
> **Tác giả**: Senior Game Developer & Software Architect (DeepMind Team)  
> **Trạng thái**: **COMPLETED – READY FOR TECHNICAL AUDIT & ACCEPTANCE**  
> **Ngày hoàn thành**: 07/11/2026  

---

## 1. TỔNG QUAN GIAI ĐOẠN (EXECUTIVE SUMMARY)

Stage 3B.2 tập trung hoàn thiện cơ chế **đặt bom** và **quyền đi xuyên quả bom vừa đặt (Player Bomb Pass-through)**, tích hợp trực tiếp nền tảng `BombSystem` cốt lõi (từ Stage 3B.1) với hệ thống điều khiển nhân vật `Player`, va chạm `PlayerCollisionSystem` và màn chơi `GameScene`.

Toàn bộ giải pháp được xây dựng tuân thủ nghiêm ngặt theo quyết định kiến trúc đã được Technical Lead phê chuẩn tại **ADR-013** và tài liệu thiết kế kỹ thuật **`Agents/STAGE_3A_TECHNICAL_DESIGN.md`**, loại bỏ hoàn toàn cơ chế timer 0.2s tạm thời trước đây.

### Các kết quả then chốt:
1. **Phím đặt bom Single-shot**: Người chơi nhấn phím `Space` để đặt bom. Cơ chế JustDown theo dõi frame trước (`isSpaceDownPrevious`) đảm bảo phím nhấn giữ không tự động đặt bom liên tục; chỉ kích hoạt lại sau khi nhả và nhấn lại phím.
2. **Tọa độ đặt bom chính xác**: Bom luôn được đặt tại đúng ô lưới logic tương ứng với tâm Hitbox của người chơi (`GridMath.worldToGrid`), snap chính xác và an toàn.
3. **Cơ chế Spatial Disjoint AABB (ADR-013)**: Player được tự do di chuyển và đi xuyên qua quả bom do chính mình vừa đặt chừng nào hộp va chạm AABB 28x28 của nhân vật còn giao nhau (Overlap) với ô chứa bom.
4. **Thu hồi quyền tức thì & ngăn chặn tái nhập**: Ngay khi toàn bộ AABB của Player rời khỏi ô bom, quyền đi xuyên bị thu hồi vĩnh viễn cho quả bom đó. Ô bom lập tức trở thành vật cản rắn (`TileType.BOMB`, `isWalkable = false`), Player không thể quay trở lại ô đó khi bom vẫn còn tồn tại.
5. **Cách ly đa thực thể độc lập**: Quyền đi xuyên được quản lý theo cấu trúc `Map<playerId, Set<bombId>>`. Các thực thể khác (Player 2, Quái vật trong tương lai) hoàn toàn bị chặn đứng bởi quả bom của Player 1.
6. **Bảo toàn trọn vẹn hệ thống di chuyển Stage 2C/2C.1**: Thuật toán Corner Sliding (bao gồm cả Corridor Entry Auto-Centering và T-Junction Rounding), Sub-stepping (4px) và Kinematic Sensor Body (ADR-012) tiếp tục hoạt động mượt mà và chính xác tuyệt đối quanh các quả bom rắn.
7. **Tích hợp GameScene**: Hoàn thiện vòng đời `BombSystem` trong `GameScene`, tự động dọn dẹp khi Scene shutdown/destroy và hiển thị visual marker nhấp nháy trực quan cho các quả bom đang hoạt động.
8. **Chất lượng mã nguồn**: Bổ sung **24 Unit Tests Headless** độc lập trong Vitest (nâng tổng số test toàn dự án lên **140/140 tests PASS 100%**), Typecheck 0 errors, Production Build thành công 100%.

---

## 2. DANH MỤC CÁC TỆP NGUỒN ĐÃ TẠO MỚI VÀ CHỈNH SỬA

| Tệp tin | Hành động | Vai trò kỹ thuật trong Stage 3B.2 |
| :--- | :---: | :--- |
| [`src/systems/BombPassThroughManager.ts`](file:///G:/GIT/Bomber/src/systems/BombPassThroughManager.ts) | **Tạo mới** | Quản lý quyền đi xuyên độc lập theo từng Player và từng Bomb (`Map<playerId, Set<bombId>>`), cài đặt thuật toán kiểm tra giao cắt không gian `isDisjointFromCell` và `isOverlappingCell`. |
| [`src/systems/BombSystem.ts`](file:///G:/GIT/Bomber/src/systems/BombSystem.ts) | **Chỉnh sửa** | Tích hợp `BombPassThroughManager`: Cấp quyền đi xuyên khi đặt bom thành công, thu hồi quyền của toàn bộ thực thể khi bom nổ (`EXPLODING`) hoặc hoàn tất (`FINISHED`), cung cấp API `checkEntityDisjoint` và `canEntityPassThrough`. |
| [`src/systems/PlayerCollisionSystem.ts`](file:///G:/GIT/Bomber/src/systems/PlayerCollisionSystem.ts) | **Chỉnh sửa** | Tích hợp liên kết `BombSystem`: Cài đặt `isWalkableAt(coord, playerId)` cho phép Player có quyền đi xuyên được coi ô bom là walkable; truyền `playerId` qua `resolveMovement`, `resolveSingleStep`, `tryCornerSliding` và `getFlushPosition`. Tương thích ngược 100% khi không truyền `playerId`. |
| [`src/entities/Player.ts`](file:///G:/GIT/Bomber/src/entities/Player.ts) | **Chỉnh sửa** | Bổ sung định danh `id` (mặc định `'player_1'`), liên kết `bombSystem`, cài đặt hàm `tryDropBomb()`, gọi `bombSystem.checkEntityDisjoint` mỗi khi cập nhật vị trí mới. |
| [`src/systems/PlayerInputSystem.ts`](file:///G:/GIT/Bomber/src/systems/PlayerInputSystem.ts) | **Chỉnh sửa** | Bổ sung phím `Spacebar`, cài đặt cơ chế `isBombJustPressed()` Single-shot chống phím giữ, hỗ trợ `setSpaceState(isDown)` phục vụ kiểm thử Headless không cần Scene, bảo vệ `getDirection()` trong môi trường Headless. |
| [`src/scenes/GameScene.ts`](file:///G:/GIT/Bomber/src/scenes/GameScene.ts) | **Chỉnh sửa** | Khởi tạo `BombSystem`, liên kết với `PlayerCollisionSystem` và `Player`, xử lý input Spacebar trong `update()`, render visual marker quả bom nhấp nháy xung điện, đăng ký dọn dẹp khi Scene shutdown/destroy. |
| [`tests/PlayerBombPassThrough.test.ts`](file:///G:/GIT/Bomber/tests/PlayerBombPassThrough.test.ts) | **Tạo mới** | Bộ 24 bài kiểm thử Headless toàn diện bao phủ 6 nhóm kịch bản: Input Space Single-shot, Đặt bom, Thuật toán Spatial Disjoint AABB, Tích hợp di chuyển & thu hồi quyền, Cách ly đa thực thể, Hồi quy Corner Sliding. |
| [`Agents/ARCHITECTURE.md`](file:///G:/GIT/Bomber/Agents/ARCHITECTURE.md) | **Cập nhật** | Bổ sung mục 6.2 mô tả kiến trúc Player Bomb Pass-through và quản lý quyền đi xuyên. |
| [`Agents/IMPLEMENTATION_ROADMAP.md`](file:///G:/GIT/Bomber/Agents/IMPLEMENTATION_ROADMAP.md) | **Cập nhật** | Đánh dấu hoàn thành Stage 3B.2 và cập nhật checklist nghiệm thu chi tiết. |
| [`Agents/TEST_STRATEGY.md`](file:///G:/GIT/Bomber/Agents/TEST_STRATEGY.md) | **Cập nhật** | Bổ sung mục 3.7 ghi nhận bảng kịch bản kiểm thử cho `PlayerBombPassThrough.test.ts`. |

---

## 3. CHI TIẾT TRIỂN KHAI KỸ THUẬT (TECHNICAL IMPLEMENTATION)

### 3.1. Trình quản lý quyền đi xuyên (`BombPassThroughManager.ts`)
Lớp `BombPassThroughManager` hoạt động hoàn toàn độc lập với Phaser, hỗ trợ kiểm thử Headless 100%:
- **Cấu trúc dữ liệu**: `private readonly permissions: Map<string, Set<string>>` lưu trữ ánh xạ `playerId -> Set<bombId>`.
- **Cấp quyền (`grant`)**: Gọi khi Player đặt bom thành công.
- **Kiểm tra quyền (`has`)**: Truy vấn xem `playerId` có quyền đi xuyên qua `bombId` hay không.
- **Thu hồi quyền (`revoke`)**: Xóa `bombId` khỏi tập hợp của `playerId`. Khi Set rỗng, xóa luôn entry của Player khỏi Map để triệt tiêu memory leak.
- **Thu hồi toàn cục (`revokeBombFromAll`)**: Xóa `bombId` khỏi mọi Player (được kích hoạt khi bom nổ hoặc finish).
- **Thuật toán kiểm tra không gian rời rạc (`isDisjointFromCell`)**:
  ```typescript
  public static isDisjointFromCell(playerAABB: IHitboxAABB, cellCoord: IGridCoord): boolean {
    const cellLeft = cellCoord.col * GAME_DIMENSIONS.TILE_SIZE;
    const cellRight = (cellCoord.col + 1) * GAME_DIMENSIONS.TILE_SIZE;
    const cellTop = GAME_DIMENSIONS.HUD_HEIGHT + cellCoord.row * GAME_DIMENSIONS.TILE_SIZE;
    const cellBottom = GAME_DIMENSIONS.HUD_HEIGHT + (cellCoord.row + 1) * GAME_DIMENSIONS.TILE_SIZE;

    return (
      playerAABB.right <= cellLeft ||
      playerAABB.left >= cellRight ||
      playerAABB.bottom <= cellTop ||
      playerAABB.top >= cellBottom
    );
  }
  ```
  *Quy tắc chuẩn ADR-013*: Nếu mép của Player tiếp xúc đúng đường biên của cell (dấu `<=`, `>=`), đối tượng được xem là đã hoàn toàn rời khỏi cell.

---

### 3.2. Nâng cấp hệ thống va chạm (`PlayerCollisionSystem.ts`)
Để `PlayerCollisionSystem` nhận diện được quyền đi xuyên mà không phụ thuộc vòng lặp (Circular Dependency) vào `Player` Entity:
- **Dependency Injection**: Tiếp nhận `BombSystem` qua constructor hoặc setter `setBombSystem()`.
- **Kiểm tra tính di chuyển được (`isWalkableAt`)**:
  ```typescript
  public isWalkableAt(coord: IGridCoord, playerId?: string): boolean {
    const tile = this.gridSystem.getTile(coord);
    if (tile === null) return false;

    if (tile === TileType.BOMB && this.bombSystem && playerId) {
      const bomb = this.bombSystem.getBombAt(coord);
      if (bomb && this.bombSystem.canEntityPassThrough(playerId, bomb.id)) {
        return true; // Có quyền đi xuyên -> Coi ô bom là Walkable
      }
    }

    return this.gridSystem.isWalkable(coord);
  }
  ```
- **Xuyên suốt chuỗi di chuyển**: Tham số `playerId?: string` được truyền an toàn qua:
  - `isColliding(x, y, playerId)`
  - `resolveMovement(x, y, dir, dt, playerId)`
  - `resolveSingleStep(x, y, dir, moveDist, playerId)`
  - `tryCornerSliding(x, y, dir, slideDist, targetX, targetY, playerId)`
  - `getFlushPosition(x, y, dir, maxDist, playerId)`
- **Tương thích ngược**: Nếu không truyền `playerId`, các hàm mặc định coi `TileType.BOMB` là vật cản cứng không thể xuyên qua, bảo toàn 100% tính đúng đắn của toàn bộ các unit test cũ.

---

### 3.3. Tích hợp điều khiển nhân vật (`Player.ts`)
- **Định danh duy nhất**: Thuộc tính `private readonly id: string` (mặc định `'player_1'`).
- **Liên kết BombSystem**: Phương thức `setBombSystem(bombSystem: BombSystem)` cho phép gán hệ thống quản lý bom.
- **Thả bom (`tryDropBomb`)**:
  ```typescript
  public tryDropBomb(): IBombData | null {
    if (!this.bombSystem) return null;
    const currentGrid = GridMath.worldToGrid({ x: this.x, y: this.y });
    return this.bombSystem.tryPlaceBomb({
      ownerId: this.id,
      coord: currentGrid,
    });
  }
  ```
- **Tự động kiểm tra Disjoint trong vòng lặp di chuyển**:
  Trong `updateMovement(direction, deltaSeconds)`:
  Ngay sau khi cập nhật vị trí `this.setPosition(result.x, result.y)`, gọi:
  ```typescript
  if (this.bombSystem) {
    this.bombSystem.checkEntityDisjoint(this.id, this.getHitboxAABB());
  }
  ```
  Nhờ đó, mỗi khi nhân vật di chuyển dù chỉ 1 pixel ra khỏi ô chứa bom, quyền đi xuyên được kiểm tra và thu hồi ngay trong frame đó.

---

### 3.4. Hệ thống phím Single-shot (`PlayerInputSystem.ts`)
- **Phím Spacebar**: Khởi tạo `this.keySpace = keyboard.addKey(32)`.
- **Nhận diện JustDown độc lập**:
  ```typescript
  public isBombJustPressed(): boolean {
    if (this.isCleanedUp) return false;

    const isDown = Boolean(
      this.keySpace?.isDown ||
      this.cursors?.space?.isDown ||
      this.headlessSpaceDown
    );

    const justPressed = isDown && !this.isSpaceDownPrevious;
    this.isSpaceDownPrevious = isDown;
    return justPressed;
  }
  ```
- **Hỗ trợ kiểm thử Headless**: Cung cấp `setSpaceState(isDown: boolean)` cho phép test phím bấm chính xác trong môi trường Vitest không có trình duyệt.
- **An toàn Headless**: Cập nhật `getDirection()` chỉ đọc từ phím vật lý khi các key object đã được khởi tạo, không ghi đè trạng thái của `resolver` khi chạy kiểm thử độc lập.

---

### 3.5. Tích hợp màn chơi (`GameScene.ts`)
- **Khởi tạo và liên kết**:
  - `this.bombSystem = new BombSystem(this.gridSystem);`
  - `this.collisionSystem = new PlayerCollisionSystem(this.gridSystem, this.bombSystem);`
  - `this.player.setBombSystem(this.bombSystem);`
  - `this.bombSystem.registerOwner(this.player.getId(), BOMB_CONFIG.DEFAULT_BOMB_CAPACITY);`
- **Vòng lặp `update()`**:
  - Nhận diện phím `Space` và gọi `this.player.tryDropBomb()`.
  - Cập nhật đếm lùi fuse `this.bombSystem.update(deltaSeconds)`.
  - Cập nhật di chuyển cho Player `this.player.updateMovement(direction, deltaSeconds)`.
  - Render marker trực quan cho các quả bom đang active `this.renderBombs()`.
- **Dọn dẹp vòng đời Scene**:
  - Đăng ký sự kiện `this.events.once('shutdown', () => this.bombSystem.cleanup())`.
  - Đăng ký sự kiện `this.events.once('destroy', () => this.bombSystem.cleanup())`.
- **Visual Marker**:
  Vẽ các quả bom đang hoạt động bằng `Phaser.GameObjects.Graphics` (độ sâu depth 5, nằm dưới Player depth 10, trên sàn đấu):
  Khối tròn sẫm màu với viền sáng nhấp nháy theo tần số nhịp tim của ngòi nổ (`Math.sin(remainingTime * 10)`), kèm đốm lửa vàng cam sống động.

---

## 4. PHÂN TÍCH TOÁN HỌC & ĐẶC TẢ SPATIAL DISJOINT AABB

### Kích thước và Tọa độ chuẩn hóa:
- **Kích thước Cell**: $48 \times 48\text{ px}$.
- **Hitbox của Player**: $28 \times 28\text{ px}$ căn giữa trên Sprite $48 \times 48\text{ px}$ (Offset $10\text{ px}$ mỗi bên).
- **HUD Height**: $48\text{ px}$.

Giả sử ô bom tại tọa độ lưới $(col, row)$:
$$\begin{cases}
cellLeft = col \times 48 \\
cellRight = (col + 1) \times 48 \\
cellTop = 48 + row \times 48 \\
cellBottom = 48 + (row + 1) \times 48
\end{cases}$$

Hộp va chạm của Player tại tâm $(x, y)$:
$$\begin{cases}
player.left = x - 14 \\
player.right = x + 14 \\
player.top = y - 14 \\
player.bottom = y + 14
\end{cases}$$

### Điều kiện Disjoint (ADR-013):
$$\text{isDisjoint} \iff (player.right \le cellLeft) \lor (player.left \ge cellRight) \lor (player.bottom \le cellTop) \lor (player.top \ge cellBottom)$$

### Chứng minh các tính chất quan trọng:
1. **Không bao giờ bị kẹt khi vừa đặt bom**:
   Khi Player đứng tại tâm cell $(col, row)$, tọa độ tâm là $(col \times 48 + 24, 48 + row \times 48 + 24)$.
   Hộp AABB có $left = col \times 48 + 10 > cellLeft$ và $right = col \times 48 + 38 < cellRight$.
   Do đó, $\text{isDisjoint} = \text{false}$. Player luôn overlap hoàn toàn với cell vừa đặt bom và được cấp quyền đi xuyên ngay lập tức, đảm bảo người chơi có thể bước ra ngoài theo bất kỳ hướng nào mà không bao giờ bị kẹt.
2. **Tiếp xúc biên là Disjoint**:
   Khi Player bước sang phải sang cell $(col + 1, row)$, khi tâm $x$ đạt $col \times 48 + 48 + 14 = (col + 1) \times 48 + 14$, $player.left = (col + 1) \times 48 = cellRight$.
   Theo công thức, $player.left \ge cellRight$ thỏa mãn $\implies \text{isDisjoint} = \text{true}$.
   Quyền đi xuyên bị thu hồi đúng vào khoảnh khắc mép sau của hitbox vừa chạm mép ô chứa bom.
3. **Không thể quay lại sau khi Disjoint**:
   Khi quyền đã bị thu hồi, ô bom mang `TileType.BOMB` với `isWalkable = false`. Trong `PlayerCollisionSystem`, hàm `isWalkableAt` trả về `false`.
   Mép hitbox của nhân vật khi di chuyển ngược lại sẽ bị chặn đứng tại $player.left = cellRight$ bởi thuật toán Pixel-flush stopping, ngăn ngừa 100% việc lấn sân trở lại ô bom.

---

## 5. BÁO CÁO KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (UNIT TESTS)

Tệp kiểm thử mới [`tests/PlayerBombPassThrough.test.ts`](file:///G:/GIT/Bomber/tests/PlayerBombPassThrough.test.ts) bao gồm **24 bài kiểm thử Headless độc lập** kiểm tra toàn bộ các khía cạnh của Stage 3B.2:

```
 RUN  v1.6.1 G:/GIT/Bomber

 ✓ tests/EventBus.test.ts (4 tests)
 ✓ tests/GameMap.test.ts (5 tests)
 ✓ tests/PlayerInput.test.ts (8 tests)
 ✓ tests/GridMath.test.ts (11 tests)
 ✓ tests/PlayerCollision.test.ts (6 tests)
 ✓ tests/PlayerHitbox.test.ts (4 tests)
 ✓ tests/MapGenerator.test.ts (8 tests)
 ✓ tests/CornerSliding.test.ts (17 tests)
 ✓ tests/PlayerMovement.test.ts (8 tests)
 ✓ tests/GridSystem.test.ts (11 tests)
 ✓ tests/BombSystem.test.ts (34 tests)
 ✓ tests/PlayerBombPassThrough.test.ts (24 tests)

 Test Files  12 passed (12)
      Tests  140 passed (140)
   Duration  621ms
```

### Chi tiết 24 bài kiểm thử Stage 3B.2:

#### Nhóm 1: Input Tests (Single-shot Spacebar)
- `UT-INPUT-01`: Nhấn đơn phím Space trả về `isBombJustPressed() = true` ở lần truy vấn đầu tiên.
- `UT-INPUT-02`: Nhấn giữ phím Space tiếp tục trả về `false` ở các frame tiếp theo (không tự động lặp lại).
- `UT-INPUT-03`: Nhả phím Space và nhấn lại trả về `true` chính xác.
- `UT-INPUT-04`: Phím điều hướng Arrow Keys / WASD không bị ảnh hưởng khi phím Space được nhấn hoặc giữ.
- `UT-INPUT-05`: Sau khi gọi `cleanup()`, `isBombJustPressed()` luôn trả về `false`.

#### Nhóm 2: Đặt bom & Cấp quyền đi xuyên
- `UT-PLACE-01`: Đặt bom tại đúng ô lưới logic tương ứng với tâm Player (1, 1).
- `UT-PLACE-02`: Player đứng lệch tâm trong ô (1, 1) vẫn snap chính xác vào ô (1, 1).
- `UT-PLACE-03`: Đặt bom vào ô đã có quả bom khác bị từ chối (trả về `null`).
- `UT-PLACE-04`: Đặt bom khi đã hết Capacity bị từ chối.
- `UT-PLACE-05`: Đặt bom trên Tường cứng hoặc Gạch mềm bị từ chối.
- `UT-PLACE-06`: Đặt bom thành công lập tức cấp quyền đi xuyên cho Player trong `BombPassThroughManager`.

#### Nhóm 3: Công thức toán học Spatial Disjoint AABB
- `UT-DISJOINT-01`: Trả về `false` khi AABB của Player còn giao cắt với ô bom (căn giữa hoặc mép).
- `UT-DISJOINT-02`: Trả về `true` khi AABB của Player nằm hoàn toàn ngoài ô bom theo cả 4 hướng (RIGHT, LEFT, TOP, BOTTOM).
- `UT-DISJOINT-03`: Tiếp xúc đúng đường biên viền (`player.right === cellLeft`, `player.left === cellRight`,...) được tính là đã disjoint theo ADR-013.

#### Nhóm 4: Tích hợp di chuyển & Thu hồi quyền
- `UT-PASS-01`: Player không bị kẹt khi vừa thả bom, di chuyển tự do khi còn overlap.
- `UT-PASS-02`: Di chuyển sang PHẢI ra khỏi ô bom thu hồi quyền đi xuyên ngay khi vừa disjoint.
- `UT-PASS-03`: Sau khi bị thu hồi quyền, Player không thể quay ngược trở lại sang TRÁI vào ô bom (bị chặn đứng).
- `UT-PASS-04`: Di chuyển XUỐNG DƯỚI ra khỏi ô bom -> disjoint -> bị chặn khi thử đi LÊN lại vào ô bom.

#### Nhóm 5: Đa bom & Cách ly đa thực thể
- `UT-MULTI-01`: Player đặt liên tiếp 2 quả bom A và B: khi rời khỏi ô bom A, quyền bom A bị thu hồi nhưng quyền bom B vẫn được giữ nguyên.
- `UT-MULTI-02`: Cách ly thực thể: Player 2 không thể đi xuyên qua quả bom do Player 1 vừa đặt.
- `UT-MULTI-03`: Quả bom phát nổ (`EXPLODING`) tự động dọn sạch quyền đi xuyên của quả bom đó trên toàn hệ thống.
- `UT-MULTI-04`: Dọn dẹp hệ thống `cleanup()` xóa sạch mọi quyền đi xuyên còn tồn đọng.

#### Nhóm 6: Hồi quy va chạm & Trượt góc
- `UT-CORNER-01`: Quả bom rắn (đã bị thu hồi quyền) hoạt động như một khối cản 1x1 chuẩn mực, hỗ trợ dừng sát mép (pixel-flush).
- `UT-CORNER-02`: Khi không truyền `playerId` vào `PlayerCollisionSystem`, quả bom được đối xử như khối cản rắn tuyệt đối (đảm bảo tính tương thích ngược).

---

## 6. KẾT QUẢ TYPECHECK VÀ PRODUCTION BUILD

### 1. TypeScript Typecheck
```powershell
> npm run typecheck
> tsc --noEmit
# Exit code: 0 (0 errors)
```

### 2. Production Build (Vite)
```powershell
> npm run build
> tsc --noEmit && vite build

vite v5.4.21 building for production...
transforming...
✓ 30 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.84 kB │ gzip:   0.86 kB
dist/assets/index-NJdO-sP1.js      28.76 kB │ gzip:   9.11 kB │ map:    123.92 kB
dist/assets/phaser-DGOJFvlN.js  1,478.62 kB │ gzip: 337.77 kB │ map: 10,169.94 kB
✓ built in 11.37s
# Exit code: 0
```
Bundle kích thước nhỏ gọn, không cảnh báo biên dịch, cấu trúc module tối ưu.

---

## 7. KIỂM SOÁT PHẠM VI NGHIÊM NGẶT (SCOPE CREEP GUARDRAIL)

Tuân thủ nghiêm ngặt chỉ thị của Technical Lead và tài liệu kiến trúc, Stage 3B.2 **tuyệt đối không triển khai**:
1. ❌ **Chưa triển khai Raycasting & Tia lửa vụ nổ** (`ExplosionRaycaster`, `ExplosionSystem` thuộc Stage 3B.3).
2. ❌ **Chưa triển khai Nổ dây chuyền** (Chain Reaction BFS thuộc Stage 3B.3).
3. ❌ **Chưa triển khai Phá hủy Gạch mềm & Spawn Vật phẩm** (thuộc Stage 3B.3).
4. ❌ **Chưa triển khai Sát thương vụ nổ & Mất mạng Player** (thuộc Stage 3B.3 / Stage 5).
5. ❌ **Chưa triển khai Texture Pixel Art cuối cùng hoặc Animation hoàn chỉnh cho Bomb** (thuộc Stage 3B.4).
6. ❌ **Chưa triển khai Enemy AI, Power-up, Âm thanh, Điểm số hay Chuyển màn**.

---

## 8. KẾT LUẬN & ĐỀ XUẤT BƯỚC TIẾP THEO

Stage 3B.2 đã hoàn thành **100% mục tiêu kỹ thuật** một cách vững chắc, đáp ứng toàn diện các tiêu chí Acceptance Criteria:
- Hệ thống đặt bom phản hồi mượt mà bằng phím Space (Single-shot).
- Thuật toán **Spatial Disjoint AABB** tuân thủ hoàn hảo **ADR-013**, triệt tiêu vĩnh viễn bug kẹt nhân vật và lỗi đi xuyên bom trái phép.
- Giữ vững toàn bộ các tính năng trượt góc tinh xảo (Corner Sliding), sub-stepping và kinematic body từ Stage 2C/2C.1.
- Toàn bộ 140 bài unit test và quy trình build đều vượt qua mỹ mãn.

### Đề xuất cho Stage tiếp theo (Stage 3B.3):
Kính trình Technical Lead xem xét, đánh giá và cấp phép chuyển sang **Stage 3B.3: Explosion System, Raycasting & Chain Reaction**:
- Triển khai thuật toán Raycasting 4 hướng chữ thập (dừng lại tại Hard Wall, phá vỡ Soft Brick, kích nổ Bom khác).
- Kích nổ dây chuyền phi đệ quy (Non-recursive BFS Chain Reaction) theo Quyết định 2 (phê duyệt ở Stage 3A.1).
- Quản lý vụ nổ theo từng cell và gộp hiển thị (CellExplosionTracker & Visual Stacking) theo Quyết định 3.
- Tính toán thời lượng vụ nổ 0.4s và kiểm tra va chạm gây sát thương.
