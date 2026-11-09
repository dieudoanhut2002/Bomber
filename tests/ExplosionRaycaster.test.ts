import { describe, it, expect, beforeEach } from 'vitest';
import { ExplosionRaycaster } from '@/systems/ExplosionRaycaster';
import { GridSystem } from '@/systems/GridSystem';
import { BombSystem } from '@/systems/BombSystem';
import { GameMap } from '@/core/GameMap';
import { TileType } from '@/types/Grid.types';

describe('ExplosionRaycaster (Thuật toán Raycasting Vụ Nổ Chữ Thập)', () => {
  let gridSystem: GridSystem;
  let bombSystem: BombSystem;
  let raycaster: ExplosionRaycaster;
  let gameMap: GameMap;

  // Tạo một bản đồ trống có tường bao (15x13) để kiểm thử raycasting không gian mở
  function createOpenMap(): GameMap {
    const tiles: TileType[][] = [];
    for (let r = 0; r < 13; r++) {
      const row: TileType[] = [];
      for (let c = 0; c < 15; c++) {
        if (r === 0 || r === 12 || c === 0 || c === 14) {
          row.push(TileType.HARD_WALL);
        } else {
          row.push(TileType.EMPTY);
        }
      }
      tiles.push(row);
    }
    return new GameMap({
      stage: 1,
      width: 15,
      height: 13,
      tiles,
      playerSpawn: { col: 1, row: 1 },
      exitCoord: { col: 7, row: 7 },
    });
  }

  beforeEach(() => {
    gameMap = createOpenMap();
    gridSystem = new GridSystem(gameMap);
    bombSystem = new BombSystem(gridSystem);
    raycaster = new ExplosionRaycaster(gridSystem, bombSystem);
  });

  it('UT-RAY-01: Power 1 Open Space sinh đúng 5 segments (1 Center + 4 Tips)', () => {
    const origin = { col: 7, row: 6 };
    const result = raycaster.calculateBlast(origin, 1);

    expect(result.power).toBe(1);
    expect(result.segments).toHaveLength(5);

    const center = result.segments.find((s) => s.direction === 'CENTER');
    expect(center).toBeDefined();
    expect(center?.coord).toEqual(origin);
    expect(center?.isTip).toBe(false);

    const tips = result.segments.filter((s) => s.isTip);
    expect(tips).toHaveLength(4);
  });

  it('UT-RAY-02: Power 2 Open Space sinh đúng 9 segments (1 Center + 4 Bodies + 4 Tips)', () => {
    const origin = { col: 7, row: 6 };
    const result = raycaster.calculateBlast(origin, 2);

    expect(result.power).toBe(2);
    expect(result.segments).toHaveLength(9);

    const tips = result.segments.filter((s) => s.isTip);
    expect(tips).toHaveLength(4);

    const bodies = result.segments.filter(
      (s) => !s.isTip && s.direction !== 'CENTER'
    );
    expect(bodies).toHaveLength(4);
  });

  it('UT-RAY-03: Power 3 Open Space sinh đúng 13 segments trong không gian mở', () => {
    const origin = { col: 7, row: 6 };
    const result = raycaster.calculateBlast(origin, 3);

    expect(result.power).toBe(3);
    expect(result.segments).toHaveLength(13); // 1 + 4 * 3 = 13
  });

  it('UT-RAY-04: Clamp Invalid Power về tối thiểu 1 ô', () => {
    const origin = { col: 7, row: 6 };
    const resultZero = raycaster.calculateBlast(origin, 0);
    expect(resultZero.power).toBe(1);
    expect(resultZero.segments).toHaveLength(5);

    const resultNegative = raycaster.calculateBlast(origin, -5);
    expect(resultNegative.power).toBe(1);
    expect(resultNegative.segments).toHaveLength(5);
  });

  it('UT-RAY-05: Out of Bounds Origin trả về mảng segments rỗng an toàn', () => {
    const result = raycaster.calculateBlast({ col: -1, row: 5 }, 1);
    expect(result.segments).toHaveLength(0);
    expect(result.destroyedBricks).toHaveLength(0);
    expect(result.triggeredBombs).toHaveLength(0);
  });

  it('UT-RAY-WALL-01: Hard Wall Adjacent chặn hoàn toàn tia nổ, không sinh segment trên tường', () => {
    // Đặt tường cứng ở (8, 6) kề sát bên phải origin (7, 6)
    gridSystem.setTile({ col: 8, row: 6 }, TileType.HARD_WALL);

    const result = raycaster.calculateBlast({ col: 7, row: 6 }, 1);
    // Nhánh RIGHT bị chặn ngay lập tức, chỉ còn Center + UP + DOWN + LEFT = 4 segments
    expect(result.segments).toHaveLength(4);
    expect(result.segments.some((s) => s.direction === 'RIGHT')).toBe(false);
  });

  it('UT-RAY-WALL-02: Hard Wall Distance 2 khi power=3 -> tia nổ dừng ở distance 1 và thành Tip', () => {
    // Origin (7, 6), tường cứng ở (9, 6) (distance 2 sang phải)
    gridSystem.setTile({ col: 9, row: 6 }, TileType.HARD_WALL);

    const result = raycaster.calculateBlast({ col: 7, row: 6 }, 3);
    const rightSegments = result.segments.filter((s) => s.direction === 'RIGHT');

    // Chỉ lan đến distance 1 tại (8, 6)
    expect(rightSegments).toHaveLength(1);
    expect(rightSegments[0].coord).toEqual({ col: 8, row: 6 });
  });

  it('UT-RAY-WALL-03: Enclosed by 4 Walls chỉ sinh duy nhất 1 Center segment', () => {
    const origin = { col: 7, row: 6 };
    gridSystem.setTile({ col: 7, row: 5 }, TileType.HARD_WALL); // UP
    gridSystem.setTile({ col: 7, row: 7 }, TileType.HARD_WALL); // DOWN
    gridSystem.setTile({ col: 6, row: 6 }, TileType.HARD_WALL); // LEFT
    gridSystem.setTile({ col: 8, row: 6 }, TileType.HARD_WALL); // RIGHT

    const result = raycaster.calculateBlast(origin, 2);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].direction).toBe('CENTER');
  });

  it('UT-RAY-BRICK-01: Soft Brick Adjacent ở distance 1 sinh segment destroyedBrick = true và isTip = true', () => {
    const origin = { col: 7, row: 6 };
    gridSystem.setTile({ col: 8, row: 6 }, TileType.SOFT_BRICK);

    const result = raycaster.calculateBlast(origin, 1);
    expect(result.destroyedBricks).toContainEqual({ col: 8, row: 6 });

    const rightSegment = result.segments.find((s) => s.direction === 'RIGHT');
    expect(rightSegment).toBeDefined();
    expect(rightSegment?.destroyedBrick).toBe(true);
    expect(rightSegment?.isTip).toBe(true);
  });

  it('UT-RAY-BRICK-02: Soft Brick Blocks Ray không cho tia nổ xuyên qua ô phía sau', () => {
    const origin = { col: 7, row: 6 };
    gridSystem.setTile({ col: 8, row: 6 }, TileType.SOFT_BRICK);

    const result = raycaster.calculateBlast(origin, 3);
    const rightSegments = result.segments.filter((s) => s.direction === 'RIGHT');

    expect(rightSegments).toHaveLength(1);
    expect(rightSegments[0].coord).toEqual({ col: 8, row: 6 });
  });

  it('UT-RAY-BRICK-03: Multiple Soft Bricks ở các hướng khác nhau đều được thu thập vào destroyedBricks', () => {
    const origin = { col: 7, row: 6 };
    gridSystem.setTile({ col: 7, row: 5 }, TileType.SOFT_BRICK); // UP
    gridSystem.setTile({ col: 8, row: 6 }, TileType.SOFT_BRICK); // RIGHT

    const result = raycaster.calculateBlast(origin, 2);
    expect(result.destroyedBricks).toHaveLength(2);
    expect(result.destroyedBricks).toContainEqual({ col: 7, row: 5 });
    expect(result.destroyedBricks).toContainEqual({ col: 8, row: 6 });
  });

  it('UT-RAY-BRICK-04: Raycaster Pure Query không tự ý làm thay đổi GridSystem', () => {
    const origin = { col: 7, row: 6 };
    gridSystem.setTile({ col: 8, row: 6 }, TileType.SOFT_BRICK);

    raycaster.calculateBlast(origin, 1);
    // Trạng thái ô trên grid vẫn phải giữ nguyên SOFT_BRICK
    expect(gridSystem.getTile({ col: 8, row: 6 })).toBe(TileType.SOFT_BRICK);
  });

  it('UT-RAY-BOMB-01: Quét trúng ô chứa Bom ARMED được ghi nhận vào triggeredBombs', () => {
    const origin = { col: 7, row: 6 };
    const bombCoord = { col: 8, row: 6 };

    // Đặt bom tại (8, 6)
    const bomb = bombSystem.tryPlaceBomb({
      ownerId: 'player1',
      coord: bombCoord,
      blastPower: 1,
    });
    expect(bomb).not.toBeNull();

    const result = raycaster.calculateBlast(origin, 1);
    expect(result.triggeredBombs).toContain(bomb!.id);
  });

  it('UT-RAY-BOMB-02: Penetrate Bomb (Power=2 tia lửa TIẾP TỤC LAN QUA ô bom sang ô tiếp theo)', () => {
    const origin = { col: 7, row: 6 };
    const bombCoord = { col: 8, row: 6 };

    bombSystem.tryPlaceBomb({
      ownerId: 'player1',
      coord: bombCoord,
      blastPower: 1,
    });

    const result = raycaster.calculateBlast(origin, 2);
    const rightSegments = result.segments.filter((s) => s.direction === 'RIGHT');

    // Tia nổ đi qua (8, 6) và tiếp tục đến (9, 6)
    expect(rightSegments).toHaveLength(2);
    expect(rightSegments[0].coord).toEqual({ col: 8, row: 6 });
    expect(rightSegments[1].coord).toEqual({ col: 9, row: 6 });
  });

  it('UT-RAY-BOMB-03: Penetrate Multiple (Quét qua 2 quả bom liên tiếp, cả 2 đều được kích nổ và lan tiếp)', () => {
    bombSystem.registerOwner('player1', 5);
    const origin = { col: 7, row: 6 };
    const b1 = bombSystem.tryPlaceBomb({
      ownerId: 'player1',
      coord: { col: 8, row: 6 },
      blastPower: 1,
    });
    const b2 = bombSystem.tryPlaceBomb({
      ownerId: 'player1',
      coord: { col: 9, row: 6 },
      blastPower: 1,
    });

    const result = raycaster.calculateBlast(origin, 3);
    expect(result.triggeredBombs).toContain(b1!.id);
    expect(result.triggeredBombs).toContain(b2!.id);

    const rightSegments = result.segments.filter((s) => s.direction === 'RIGHT');
    expect(rightSegments).toHaveLength(3);
  });

  it('UT-RAY-BOUND-01: Map Edge Blast (Vụ nổ sát tường biên dừng an toàn tại các tường bao)', () => {
    const origin = { col: 1, row: 1 };
    const result = raycaster.calculateBlast(origin, 5);

    // Không có segment nào ở tọa độ ngoài biên hoặc trên tường bao
    for (const segment of result.segments) {
      expect(segment.coord.col).toBeGreaterThanOrEqual(1);
      expect(segment.coord.col).toBeLessThanOrEqual(13);
      expect(segment.coord.row).toBeGreaterThanOrEqual(1);
      expect(segment.coord.row).toBeLessThanOrEqual(11);
    }
  });

  it('UT-RAY-BOUND-02: Exit Door Penetration (Cửa thoát hiểm không chặn tia nổ)', () => {
    const origin = { col: 7, row: 6 };
    gridSystem.setTile({ col: 8, row: 6 }, TileType.EXIT_DOOR_LOCKED);

    const result = raycaster.calculateBlast(origin, 2);
    const rightSegments = result.segments.filter((s) => s.direction === 'RIGHT');

    // Cửa thoát hiểm không chặn tia nổ -> tia tiếp tục đến (9, 6)
    expect(rightSegments).toHaveLength(2);
  });
});
