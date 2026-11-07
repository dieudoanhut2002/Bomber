import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerCollisionSystem } from '@/systems/PlayerCollisionSystem';
import { GridSystem } from '@/systems/GridSystem';
import { GameMap } from '@/core/GameMap';
import { TileType } from '@/types/Grid.types';

describe('Player Collision Detection & Resolution', () => {
  let gridSystem: GridSystem;
  let collisionSystem: PlayerCollisionSystem;

  beforeEach(() => {
    // Tạo bản đồ mẫu 15x13 toàn bộ là EMPTY, chỉ có viền bao quanh
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

  it('UT-COLLISION-01: Đi lại tự do trong vùng ô sàn rỗng (EMPTY)', () => {
    // Vị trí (72, 120) là tâm ô (1, 1) trống
    expect(collisionSystem.isColliding(72, 120)).toBe(false);

    // Di chuyển sang ô (2, 1) tâm (120, 120)
    const result = collisionSystem.resolveMovement(72, 120, 'RIGHT', 0.1);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-COLLISION-02: Bị chặn tuyệt đối không thể đi xuyên Tường cứng (HARD_WALL)', () => {
    // Đặt tường cứng tại ô (2, 1) [x: 96-144]
    gridSystem.setTile({ col: 2, row: 1 }, TileType.HARD_WALL);

    // Bắt đầu tại (1, 1) tâm x = 72. Mép trái của ô (2, 1) là x = 96.
    // Với Hitbox nửa rộng 14px, vị trí X tối đa nhân vật có thể chạm tới là 96 - 14 = 82px.
    const startX = 72;
    const startY = 120;

    // Cố gắng chạy sang phải với thời gian lớn (vượt quá bức tường)
    const result = collisionSystem.resolveMovement(startX, startY, 'RIGHT', 1.0);

    // Tọa độ X phải dừng lại trước hoặc tại mép tường (<= 82), tuyệt đối không xuyên qua
    expect(result.x).toBeLessThanOrEqual(82.01);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-COLLISION-03: Bị chặn tuyệt đối không thể đi xuyên Gạch mềm (SOFT_BRICK)', () => {
    // Đặt gạch mềm tại ô (1, 2) phía dưới [y: 144-192]
    gridSystem.setTile({ col: 1, row: 2 }, TileType.SOFT_BRICK);

    const startX = 72;
    const startY = 120;

    // Cố gắng chạy xuống dưới với thời gian lớn
    const result = collisionSystem.resolveMovement(startX, startY, 'DOWN', 1.0);

    // Mép trên của ô (1, 2) là y = 48 + 2 * 48 = 144. Hitbox dừng tại 144 - 14 = 130px.
    expect(result.y).toBeLessThanOrEqual(130.01);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-COLLISION-04: Ngăn chặn vượt biên giới hạn sàn đấu (World Bounds & Walls)', () => {
    // Row 0 là tường bao phía trên (y: 48-96). Row 1 là sàn (y: 96-144).
    // Tại y = 110, mép trên của Hitbox là 110 - 14 = 96 (áp sát tường row 0) -> không va chạm
    expect(collisionSystem.isColliding(72, 110)).toBe(false);

    // Đi vào tường row 0 (y = 105 -> top = 91 < 96) -> va chạm
    expect(collisionSystem.isColliding(72, 105)).toBe(true);

    // Biên trái ngoài màn hình (x = 10 -> left = -4 < 0)
    expect(collisionSystem.isColliding(10, 120)).toBe(true);

    // Biên phải ngoài màn hình (x = 715 -> right = 729 > 720)
    expect(collisionSystem.isColliding(715, 120)).toBe(true);
  });

  it('UT-COLLISION-05: Bị chặn tuyệt đối không thể đi xuyên Tường cứng phía TRÁI (LEFT)', () => {
    // Ô (0, 1) là viền HARD_WALL [x: 0-48].
    // Bắt đầu tại ô (1, 1) tâm x = 72, y = 120.
    // Với Hitbox nửa rộng 14px, vị trí X dừng tối thiểu là 48 + 14 = 62px.
    const startX = 72;
    const startY = 120;

    const result = collisionSystem.resolveMovement(startX, startY, 'LEFT', 1.0);
    expect(result.x).toBeGreaterThanOrEqual(61.99);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });

  it('UT-COLLISION-06: Bị chặn tuyệt đối không thể đi xuyên Tường cứng phía TRÊN (UP)', () => {
    // Ô (1, 0) là viền HARD_WALL [y: 48-96].
    // Bắt đầu tại ô (1, 1) tâm x = 72, y = 120.
    // Với Hitbox nửa cao 14px, vị trí Y dừng tối thiểu là 96 + 14 = 110px.
    const startX = 72;
    const startY = 120;

    const result = collisionSystem.resolveMovement(startX, startY, 'UP', 1.0);
    expect(result.y).toBeGreaterThanOrEqual(109.99);
    expect(collisionSystem.isColliding(result.x, result.y)).toBe(false);
  });
});
