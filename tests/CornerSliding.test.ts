import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerCollisionSystem } from '@/systems/PlayerCollisionSystem';
import { GridSystem } from '@/systems/GridSystem';
import { GameMap } from '@/core/GameMap';
import { TileType } from '@/types/Grid.types';

describe('Player Corner Sliding System (Cơ chế trượt góc mượt mà chuẩn Bomberman)', () => {
  let gridSystem: GridSystem;
  let collisionSystem: PlayerCollisionSystem;

  beforeEach(() => {
    // Tạo bản đồ trống 15x13 có viền bao
    const tiles: TileType[][] = Array.from({ length: 13 }, () =>
      Array.from({ length: 15 }, () => TileType.EMPTY)
    );

    for (let c = 0; c < 15; c++) {
      tiles[0][c] = TileType.HARD_WALL;
      tiles[12][c] = TileType.HARD_WALL;
    }
    for (let r = 0; r < 13; r++) {
      tiles[r][0] = TileType.HARD_WALL;
      tiles[r][14] = TileType.HARD_WALL;
    }

    const map = new GameMap({
      width: 15,
      height: 13,
      stage: 1,
      playerSpawn: { col: 1, row: 1 },
      exitCoord: { col: 2, row: 2 },
      tiles,
    });

    gridSystem = new GridSystem(map);
    collisionSystem = new PlayerCollisionSystem(gridSystem);
  });

  it('UT-SLIDE-01: Di chuyển sang PHẢI bị cản bởi Hard Wall -> Trượt LÊN khi lệch trên <= 14px', () => {
    // Đặt tường cứng tại (2, 2) [x: 96-144, y: 144-192]
    gridSystem.setTile({ col: 2, row: 2 }, TileType.HARD_WALL);
    // Ô (2, 1) phía trên bên phải là EMPTY (lối đi mở)
    gridSystem.setTile({ col: 2, row: 1 }, TileType.EMPTY);

    // Tại x = 82, mép phải của Hitbox (82 + 14 = 96) áp sát vào ô (2, 2).
    // Đặt y = 162 (lệch LÊN TRÊN 6px so với tâm row 2 là 168px).
    const startX = 82;
    const startY = 162;

    const result = collisionSystem.resolveMovement(startX, startY, 'RIGHT', 0.05);

    // Phải trượt LÊN (giá trị Y giảm xuống)
    expect(result.didSlide).toBe(true);
    expect(result.y).toBeLessThan(startY);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-02: Di chuyển sang PHẢI bị cản bởi Soft Brick -> Trượt XUỐNG khi lệch dưới <= 14px', () => {
    // Đặt gạch mềm tại (2, 2)
    gridSystem.setTile({ col: 2, row: 2 }, TileType.SOFT_BRICK);
    // Ô (2, 3) phía dưới bên phải là EMPTY (lối đi mở)
    gridSystem.setTile({ col: 2, row: 3 }, TileType.EMPTY);

    // Áp sát mép x = 82, đặt y = 174 (lệch XUỐNG DƯỚI 6px so với tâm 168px)
    const startX = 82;
    const startY = 174;

    const result = collisionSystem.resolveMovement(startX, startY, 'RIGHT', 0.05);

    // Phải trượt XUỐNG (giá trị Y tăng lên)
    expect(result.didSlide).toBe(true);
    expect(result.y).toBeGreaterThan(startY);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-03: Di chuyển XUỐNG DƯỚI bị cản -> Trượt SANG TRÁI khi lệch trái <= 14px', () => {
    // Đặt tường cứng tại (2, 2) [x: 96-144, y: 144-192]
    gridSystem.setTile({ col: 2, row: 2 }, TileType.HARD_WALL);
    // Ô (1, 2) bên trái là EMPTY
    gridSystem.setTile({ col: 1, row: 2 }, TileType.EMPTY);

    // Tại y = 130, mép dưới của Hitbox (130 + 14 = 144) áp sát vào ô (2, 2).
    // Đặt x = 114 (lệch SANG TRÁI 6px so với tâm col 2 là 120px).
    const startX = 114;
    const startY = 130;

    const result = collisionSystem.resolveMovement(startX, startY, 'DOWN', 0.05);

    // Phải trượt SANG TRÁI (giá trị X giảm xuống)
    expect(result.didSlide).toBe(true);
    expect(result.x).toBeLessThan(startX);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-04: Di chuyển XUỐNG DƯỚI bị cản -> Trượt SANG PHẢI khi lệch phải <= 14px', () => {
    // Đặt tường cứng tại (2, 2)
    gridSystem.setTile({ col: 2, row: 2 }, TileType.HARD_WALL);
    // Ô (3, 2) bên phải là EMPTY
    gridSystem.setTile({ col: 3, row: 2 }, TileType.EMPTY);

    // Áp sát mép y = 130, đặt x = 126 (lệch SANG PHẢI 6px so với tâm 120px)
    const startX = 126;
    const startY = 130;

    const result = collisionSystem.resolveMovement(startX, startY, 'DOWN', 0.05);

    // Phải trượt SANG PHẢI (giá trị X tăng lên)
    expect(result.didSlide).toBe(true);
    expect(result.x).toBeGreaterThan(startX);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-05: Khi độ lệch vượt quá ngưỡng 14px (ví dụ 20px) -> Không kích hoạt Corner Sliding', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.HARD_WALL);

    // Áp sát x = 82, tâm ô row 2 là y = 168. Lệch 20px -> y = 148 (vượt quá ngưỡng 14px)
    const startX = 82;
    const startY = 148;

    const result = collisionSystem.resolveMovement(startX, startY, 'RIGHT', 0.05);

    // Không kích hoạt Corner Sliding
    expect(result.didSlide).toBe(false);
  });

  it('UT-SLIDE-06: Tuyệt đối không xuyên tường hoặc teleport trong quá trình Sliding', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.HARD_WALL);
    gridSystem.setTile({ col: 2, row: 1 }, TileType.EMPTY);

    let currentX = 82;
    let currentY = 162;

    // Chạy liên tục 10 bước trượt góc
    for (let i = 0; i < 10; i++) {
      const step = collisionSystem.resolveMovement(currentX, currentY, 'RIGHT', 0.016);
      currentX = step.x;
      currentY = step.y;

      // Mỗi bước đều không được va chạm
      expect(collisionSystem.isColliding(currentX, currentY)).toBe(false);
    }

    // Sau các bước trượt, tọa độ Y phải giảm dần về hướng ô (2, 1)
    expect(currentY).toBeLessThan(162);
  });

  // =========================================================================
  // CORRIDOR ENTRY AUTO-CENTERING TESTS (AUD-02)
  // =========================================================================

  it('UT-SLIDE-07: Corridor Entry - Đi SANG PHẢI vào ô mở nhưng lệch dưới -> Tự động căn giữa (trượt LÊN)', () => {
    // Ô (2, 2) thẳng phía trước là EMPTY (hành lang mở)
    gridSystem.setTile({ col: 2, row: 2 }, TileType.EMPTY);
    // Ô (2, 3) phía dưới là HARD_WALL (vật cản bên cạnh)
    gridSystem.setTile({ col: 2, row: 3 }, TileType.HARD_WALL);

    // startX = 82 (mép phải 96 áp sát mép col 2).
    // startY = 180 (tâm row 2 là 168, người chơi lệch xuống dưới +12px <= 14px).
    // Mép dưới 180 + 14 = 194 > 192 (chạm vào tường ô 2, 3).
    const startX = 82;
    const startY = 180;

    const result = collisionSystem.resolveMovement(startX, startY, 'RIGHT', 0.05);

    // Kích hoạt Corridor Entry Auto-Centering: trượt LÊN về phía tâm 168px
    expect(result.didSlide).toBe(true);
    expect(result.y).toBeLessThan(startY);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-08: Corridor Entry - Đi SANG PHẢI vào ô mở nhưng lệch trên -> Tự động căn giữa (trượt XUỐNG)', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.EMPTY);
    gridSystem.setTile({ col: 2, row: 1 }, TileType.HARD_WALL);

    // startY = 156 (tâm row 2 là 168, lệch lên trên -12px).
    // Mép trên 156 - 14 = 142 < 144 (chạm vào tường ô 2, 1).
    const startX = 82;
    const startY = 156;

    const result = collisionSystem.resolveMovement(startX, startY, 'RIGHT', 0.05);

    // Kích hoạt Corridor Entry Auto-Centering: trượt XUỐNG về phía tâm 168px
    expect(result.didSlide).toBe(true);
    expect(result.y).toBeGreaterThan(startY);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-09: Corridor Entry - Đi SANG TRÁI vào ô mở nhưng lệch dưới -> Tự động căn giữa (trượt LÊN)', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.EMPTY);
    gridSystem.setTile({ col: 2, row: 3 }, TileType.HARD_WALL);

    // Người chơi ở col 3 [x: 144-192], đi LEFT về col 2.
    // startX = 158 (mép trái 158 - 14 = 144 áp sát mép phải col 2).
    // startY = 180 (lệch xuống +12px, mép dưới 194 > 192 chạm ô 2, 3).
    const startX = 158;
    const startY = 180;

    const result = collisionSystem.resolveMovement(startX, startY, 'LEFT', 0.05);

    expect(result.didSlide).toBe(true);
    expect(result.y).toBeLessThan(startY);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-10: Corridor Entry - Đi XUỐNG DƯỚI vào ô mở nhưng lệch phải -> Tự động căn giữa (trượt SANG TRÁI)', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.EMPTY);
    gridSystem.setTile({ col: 3, row: 2 }, TileType.HARD_WALL);

    // Người chơi ở row 1 [y: 96-144], đi DOWN về row 2.
    // startY = 130 (mép dưới 130 + 14 = 144 áp sát mép trên row 2).
    // startX = 132 (tâm col 2 là 120, lệch phải +12px, mép phải 146 > 144 chạm ô 3, 2).
    const startX = 132;
    const startY = 130;

    const result = collisionSystem.resolveMovement(startX, startY, 'DOWN', 0.05);

    expect(result.didSlide).toBe(true);
    expect(result.x).toBeLessThan(startX);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-11: Corridor Entry - Đi LÊN TRÊN vào ô mở nhưng lệch phải -> Tự động căn giữa (trượt SANG TRÁI)', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.EMPTY);
    gridSystem.setTile({ col: 3, row: 2 }, TileType.HARD_WALL);

    // Người chơi ở row 3 [y: 192-240], đi UP về row 2.
    // startY = 206 (mép trên 206 - 14 = 192 áp sát mép dưới row 2).
    // startX = 132 (tâm col 2 là 120, lệch phải +12px, mép phải 146 > 144 chạm ô 3, 2).
    const startX = 132;
    const startY = 206;

    const result = collisionSystem.resolveMovement(startX, startY, 'UP', 0.05);

    expect(result.didSlide).toBe(true);
    expect(result.x).toBeLessThan(startX);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-12: Khi ô thẳng phía trước BỊ CHẶN và các góc cũng BỊ CHẶN -> Không trượt', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.HARD_WALL);
    gridSystem.setTile({ col: 2, row: 1 }, TileType.HARD_WALL);
    gridSystem.setTile({ col: 2, row: 3 }, TileType.HARD_WALL);

    const startX = 82;
    const startY = 180;

    const result = collisionSystem.resolveMovement(startX, startY, 'RIGHT', 0.05);
    expect(result.didSlide).toBe(false);
  });

  // =========================================================================
  // SYMMETRICAL T-JUNCTION CORNER ROUNDING TESTS (AUD-05)
  // =========================================================================

  it('UT-SLIDE-13: T-Junction - Di chuyển sang TRÁI bị cản -> Trượt LÊN khi lệch trên <= 14px', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.HARD_WALL);
    gridSystem.setTile({ col: 2, row: 1 }, TileType.EMPTY);

    // startX = 158 (áp sát mép phải ô 2, 2). startY = 162 (lệch trên 6px so với tâm 168)
    const startX = 158;
    const startY = 162;

    const result = collisionSystem.resolveMovement(startX, startY, 'LEFT', 0.05);

    expect(result.didSlide).toBe(true);
    expect(result.y).toBeLessThan(startY);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-14: T-Junction - Di chuyển sang TRÁI bị cản -> Trượt XUỐNG khi lệch dưới <= 14px', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.HARD_WALL);
    gridSystem.setTile({ col: 2, row: 3 }, TileType.EMPTY);

    const startX = 158;
    const startY = 174;

    const result = collisionSystem.resolveMovement(startX, startY, 'LEFT', 0.05);

    expect(result.didSlide).toBe(true);
    expect(result.y).toBeGreaterThan(startY);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-15: T-Junction - Di chuyển LÊN TRÊN bị cản -> Trượt SANG TRÁI khi lệch trái <= 14px', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.HARD_WALL);
    gridSystem.setTile({ col: 1, row: 2 }, TileType.EMPTY);

    // startY = 206 (áp sát mép dưới ô 2, 2). startX = 114 (lệch trái 6px so với tâm 120)
    const startX = 114;
    const startY = 206;

    const result = collisionSystem.resolveMovement(startX, startY, 'UP', 0.05);

    expect(result.didSlide).toBe(true);
    expect(result.x).toBeLessThan(startX);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-SLIDE-16: T-Junction - Di chuyển LÊN TRÊN bị cản -> Trượt SANG PHẢI khi lệch phải <= 14px', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.HARD_WALL);
    gridSystem.setTile({ col: 3, row: 2 }, TileType.EMPTY);

    const startX = 126;
    const startY = 206;

    const result = collisionSystem.resolveMovement(startX, startY, 'UP', 0.05);

    expect(result.didSlide).toBe(true);
    expect(result.x).toBeGreaterThan(startX);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  // =========================================================================
  // BOUNDARY OFFSET THRESHOLD TESTS (AUD-05)
  // =========================================================================

  it('UT-SLIDE-17: Ranh giới ngưỡng Corner Slide - Lệch đúng 14px (trượt) vs lệch 15px (không trượt)', () => {
    gridSystem.setTile({ col: 2, row: 2 }, TileType.HARD_WALL);
    gridSystem.setTile({ col: 2, row: 1 }, TileType.EMPTY);

    const startX = 82;
    // Tâm row 2 là 168.
    // Lệch đúng 14px: 168 - 14 = 154
    const result14 = collisionSystem.resolveMovement(startX, 154, 'RIGHT', 0.05);
    expect(result14.didSlide).toBe(true);

    // Lệch 15px: 168 - 15 = 153 (vượt quá ngưỡng)
    const result15 = collisionSystem.resolveMovement(startX, 153, 'RIGHT', 0.05);
    expect(result15.didSlide).toBe(false);
  });
});
