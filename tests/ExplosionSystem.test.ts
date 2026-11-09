import { describe, it, expect, beforeEach } from 'vitest';
import { ExplosionSystem } from '@/systems/ExplosionSystem';
import { ExplosionRaycaster } from '@/systems/ExplosionRaycaster';
import { BombSystem } from '@/systems/BombSystem';
import { GridSystem } from '@/systems/GridSystem';
import { GameMap } from '@/core/GameMap';
import { TileType } from '@/types/Grid.types';
import { EventBus } from '@/core/EventBus';
import { GameEvents } from '@/core/GameEvents';

describe('ExplosionSystem (Hệ thống Quản lý Vụ Nổ & Nổ Dây Chuyền BFS)', () => {
  let gridSystem: GridSystem;
  let bombSystem: BombSystem;
  let explosionSystem: ExplosionSystem;
  let raycaster: ExplosionRaycaster;
  let gameMap: GameMap;

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
    EventBus.removeAllListeners();
    gameMap = createOpenMap();
    gridSystem = new GridSystem(gameMap);
    bombSystem = new BombSystem(gridSystem);
    bombSystem.registerOwner('player1', 10);
    raycaster = new ExplosionRaycaster(gridSystem, bombSystem);
    explosionSystem = new ExplosionSystem(gridSystem, bombSystem, raycaster);
  });

  it('UT-EXP-01: Single Bomb Explode (Hồi capacity, giải phóng ô EMPTY, sinh ExplosionData)', () => {
    const coord = { col: 5, row: 5 };
    const bomb = bombSystem.tryPlaceBomb({ ownerId: 'player1', coord, blastPower: 1 });
    expect(bomb).not.toBeNull();
    expect(bombSystem.getActiveBombCount('player1')).toBe(1);
    expect(gridSystem.getTile(coord)).toBe(TileType.BOMB);

    // Fuse hết giờ -> Bom chuyển sang EXPLODING
    const explodingBombs = bombSystem.update(3.0);
    expect(explodingBombs).toHaveLength(1);
    expect(bombSystem.getActiveBombCount('player1')).toBe(0); // Capacity đã được hồi
    expect(gridSystem.getTile(coord)).toBe(TileType.EMPTY); // Ô giải phóng về EMPTY

    // Xử lý mẻ vụ nổ
    const explosions = explosionSystem.processExplosionBatch(explodingBombs);
    expect(explosions).toHaveLength(1);
    expect(explosionSystem.getActiveExplosionsCount()).toBe(1);
    expect(explosionSystem.isDamageActiveAt(coord)).toBe(true);
    expect(explosionSystem.isVisualActiveAt(coord)).toBe(true);
  });

  it('UT-EXP-02: Countdown and Finish (Đếm ngược 0.4s dọn dẹp vụ nổ, hoàn tất bomb FINISHED)', () => {
    const coord = { col: 5, row: 5 };
    const bomb = bombSystem.tryPlaceBomb({ ownerId: 'player1', coord, blastPower: 1 })!;
    const exploding = bombSystem.update(3.0);
    explosionSystem.processExplosionBatch(exploding);

    expect(explosionSystem.getActiveExplosionsCount()).toBe(1);

    // Cập nhật 0.2s -> vẫn còn hoạt động
    explosionSystem.update(0.2);
    expect(explosionSystem.getActiveExplosionsCount()).toBe(1);
    expect(explosionSystem.isDamageActiveAt(coord)).toBe(true);

    // Cập nhật thêm 0.2s nữa (tổng 0.4s) -> hết giờ vụ nổ
    const finished = explosionSystem.update(0.2);
    expect(finished).toHaveLength(1);
    expect(explosionSystem.getActiveExplosionsCount()).toBe(0);
    expect(explosionSystem.isDamageActiveAt(coord)).toBe(false);
    expect(explosionSystem.isVisualActiveAt(coord)).toBe(false);
    expect(bombSystem.getBombById(bomb.id)).toBeNull(); // Bom đã FINISHED và bị xóa khỏi registry
  });

  it('UT-EXP-03: Destroy Soft Wall Grid (Phá hủy gạch mềm và bắn sự kiện BLOCK_DESTROYED)', () => {
    const brickCoord = { col: 6, row: 5 };
    gridSystem.setTile(brickCoord, TileType.SOFT_BRICK);

    let blockDestroyedFired = false;
    EventBus.on(GameEvents.BLOCK_DESTROYED, (payload) => {
      if (payload.col === brickCoord.col && payload.row === brickCoord.row) {
        blockDestroyedFired = true;
      }
    });

    bombSystem.tryPlaceBomb({
      ownerId: 'player1',
      coord: { col: 5, row: 5 },
      blastPower: 1,
    });
    const exploding = bombSystem.update(3.0);
    explosionSystem.processExplosionBatch(exploding);

    expect(gridSystem.getTile(brickCoord)).toBe(TileType.EMPTY);
    expect(blockDestroyedFired).toBe(true);
  });

  it('UT-EXP-MULTI-EXPIRE: Same Frame Expiration (Nhiều bom cùng hết giờ trong 1 frame)', () => {
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 3, row: 3 }, blastPower: 1 });
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 8, row: 8 }, blastPower: 1 });

    const exploding = bombSystem.update(3.0);
    expect(exploding).toHaveLength(2);

    const explosions = explosionSystem.processExplosionBatch(exploding);
    expect(explosions).toHaveLength(2);
    expect(explosionSystem.getActiveExplosionsCount()).toBe(2);
  });

  it('UT-EXP-DEDUP-TRIGGER: Duplicate Trigger Guard (Nhiều tia nổ quét vào 1 bom, bom nổ đúng 1 lần)', () => {
    // Đặt 2 quả bom bao quanh 1 quả bom ở giữa
    const b1 = bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 5, row: 5 }, blastPower: 2 })!;
    const b2 = bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 7, row: 5 }, blastPower: 2 })!;
    const target = bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 6, row: 5 }, blastPower: 1 })!;

    // Cả b1 và b2 cùng nổ
    const exploding = bombSystem.update(3.0);
    expect(exploding.map((b) => b.id)).toContain(b1.id);
    expect(exploding.map((b) => b.id)).toContain(b2.id);

    const explosions = explosionSystem.processExplosionBatch(exploding);
    // Tổng số vụ nổ phải là 3 (b1, b2 và target)
    expect(explosions).toHaveLength(3);
    const targetExplosion = explosions.filter((e) => e.bombId === target.id);
    expect(targetExplosion).toHaveLength(1); // Target chỉ nổ đúng 1 lần
  });

  it('UT-EXP-OVERLAP: Overlapping Cells (2 vụ nổ cùng bao phủ 1 cell)', () => {
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 4, row: 5 }, blastPower: 2 });
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 6, row: 5 }, blastPower: 2 });

    const exploding = bombSystem.update(3.0);
    explosionSystem.processExplosionBatch(exploding);

    // Ô (5, 5) nằm giữa b1 và b2, cả 2 vụ nổ đều bao phủ
    const overlapCoord = { col: 5, row: 5 };
    expect(explosionSystem.isDamageActiveAt(overlapCoord)).toBe(true);
    expect(explosionSystem.isVisualActiveAt(overlapCoord)).toBe(true);
    expect(explosionSystem.getExplosionIdsAt(overlapCoord)).toHaveLength(2);
  });

  it('UT-EXP-MULTI-BRICK: Multi-blast on Brick (2 vụ nổ cùng chạm 1 viên gạch mềm -> BLOCK_DESTROYED bắn 1 lần)', () => {
    const brickCoord = { col: 5, row: 5 };
    gridSystem.setTile(brickCoord, TileType.SOFT_BRICK);

    let destroyCount = 0;
    EventBus.on(GameEvents.BLOCK_DESTROYED, (payload) => {
      if (payload.col === brickCoord.col && payload.row === brickCoord.row) {
        destroyCount++;
      }
    });

    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 4, row: 5 }, blastPower: 1 });
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 6, row: 5 }, blastPower: 1 });

    const exploding = bombSystem.update(3.0);
    explosionSystem.processExplosionBatch(exploding);

    expect(gridSystem.getTile(brickCoord)).toBe(TileType.EMPTY);
    expect(destroyCount).toBe(1);
  });

  it('UT-EXP-ALREADY-EXP: Hit Exploding Bomb (Tia nổ quét trúng bom đang EXPLODING -> bỏ qua không nổ lặp)', () => {
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 5, row: 5 }, blastPower: 1 });
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 6, row: 5 }, blastPower: 1 });

    const exploding = bombSystem.update(3.0);
    const explosions = explosionSystem.processExplosionBatch(exploding);

    expect(explosions).toHaveLength(2);
  });

  it('UT-EXP-CLEANUP-LIFE: Centralized Lifetime (Vụ nổ A hết giờ trước vụ nổ B, cell vẫn giữ lửa của B)', () => {
    // Vụ nổ A bắt đầu trước
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 4, row: 5 }, blastPower: 2 });
    explosionSystem.processExplosionBatch(bombSystem.update(3.0));

    // Trôi qua 0.2s
    explosionSystem.update(0.2);

    // Vụ nổ B bắt đầu sau
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 6, row: 5 }, blastPower: 2 });
    const expB = explosionSystem.processExplosionBatch(bombSystem.update(3.0));

    const overlapCoord = { col: 5, row: 5 };
    expect(explosionSystem.getExplosionIdsAt(overlapCoord)).toHaveLength(2);

    // Trôi tiếp 0.2s nữa -> A hết giờ (tổng 0.4s), B mới 0.2s
    explosionSystem.update(0.2);
    expect(explosionSystem.isVisualActiveAt(overlapCoord)).toBe(true);
    expect(explosionSystem.getExplosionIdsAt(overlapCoord)).toHaveLength(1);
    expect(explosionSystem.getExplosionIdsAt(overlapCoord)[0]).toBe(expB[0].id);
  });

  it('UT-CHAIN-01: Chain Reaction Adjacent (2 bom cạnh nhau kích nổ tức thì trong cùng chuỗi BFS)', () => {
    const b1 = bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 5, row: 5 }, blastPower: 1 })!;
    const b2 = bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 6, row: 5 }, blastPower: 1 })!;

    // Chỉ có b1 được kích nổ
    const exploding = [bombSystem.explodeImmediately(b1.id)!];
    expect(exploding).toHaveLength(1);
    expect(exploding[0].id).toBe(b1.id);

    // b2 vẫn đang ở trạng thái ARMED
    expect(bombSystem.getBombById(b2.id)?.state).toBe('ARMED');

    // Xử lý batch -> BFS phát hiện b2 và kích nổ dây chuyền b2 tức thì
    const explosions = explosionSystem.processExplosionBatch(exploding);
    expect(explosions).toHaveLength(2);
    expect(explosions.map((e) => e.bombId)).toContain(b1.id);
    expect(explosions.map((e) => e.bombId)).toContain(b2.id);
  });

  it('UT-CHAIN-02: Chain 5 Bombs Line (Chuỗi 5 quả bom thẳng hàng nổ dây chuyền tuần tự theo BFS)', () => {
    const bombs = [];
    for (let c = 3; c <= 7; c++) {
      bombs.push(
        bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: c, row: 5 }, blastPower: 1 })!
      );
    }

    // Chỉ bom đầu tiên (col 3) phát nổ tự nhiên
    const firstBomb = bombs[0];
    const exploding = [bombSystem.explodeImmediately(firstBomb.id)!];

    const explosions = explosionSystem.processExplosionBatch(exploding);
    expect(explosions).toHaveLength(5);
  });

  it('UT-CHAIN-03: Chain Loop 2x2 (Cụm 4 quả bom 2x2 không lặp vô hạn, mỗi bom nổ đúng 1 lần)', () => {
    const b1 = bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 5, row: 5 }, blastPower: 1 })!;
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 6, row: 5 }, blastPower: 1 });
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 5, row: 6 }, blastPower: 1 });
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 6, row: 6 }, blastPower: 1 });

    const exploding = [bombSystem.explodeImmediately(b1.id)!];
    const explosions = explosionSystem.processExplosionBatch(exploding);

    expect(explosions).toHaveLength(4);
    const bombIds = explosions.map((e) => e.bombId);
    expect(new Set(bombIds).size).toBe(4);
  });

  it('UT-CHAIN-20-STRESS: Stress Test 20 Bombs (Chuỗi nổ 20 quả bom liên hoàn hoàn thành xuất sắc)', () => {
    bombSystem.registerOwner('player1', 30);
    for (let c = 1; c <= 12; c++) {
      bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: c, row: 3 }, blastPower: 1 });
    }
    for (let c = 12; c >= 5; c--) {
      bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: c, row: 4 }, blastPower: 1 });
    }

    const firstBomb = bombSystem.getBombAt({ col: 1, row: 3 })!;
    const exploding = [bombSystem.explodeImmediately(firstBomb.id)!];

    const explosions = explosionSystem.processExplosionBatch(exploding);
    expect(explosions.length).toBeGreaterThanOrEqual(12);
  });

  it('UT-CHAIN-05: Preserve Blast Power (Quả bom kích nổ bảo toàn blastPower độc lập của chính nó)', () => {
    const b1 = bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 5, row: 5 }, blastPower: 1 })!;
    const b2 = bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 6, row: 5 }, blastPower: 3 })!;

    const exploding = [bombSystem.explodeImmediately(b1.id)!];
    const explosions = explosionSystem.processExplosionBatch(exploding);

    const exp1 = explosions.find((e) => e.bombId === b1.id);
    const exp2 = explosions.find((e) => e.bombId === b2.id);

    expect(exp1?.power).toBe(1);
    expect(exp2?.power).toBe(3);
    expect(exp2?.segments).toHaveLength(13); // power 3 open space
  });

  it('UT-STACK-VISUAL: Visual Aggregation (Tra cứu số lượng vụ nổ và kiểm tra hiển thị)', () => {
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 5, row: 5 }, blastPower: 1 });
    explosionSystem.processExplosionBatch(bombSystem.update(3.0));

    expect(explosionSystem.isVisualActiveAt({ col: 5, row: 5 })).toBe(true);
    expect(explosionSystem.getExplosionIdsAt({ col: 5, row: 5 })).toHaveLength(1);
  });

  it('UT-EXP-MULTI-PLAYER: Damage query (isDamageActiveAt trả về true khi có vụ nổ hoạt động)', () => {
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 5, row: 5 }, blastPower: 1 });
    explosionSystem.processExplosionBatch(bombSystem.update(3.0));

    expect(explosionSystem.isDamageActiveAt({ col: 5, row: 5 })).toBe(true);
    expect(explosionSystem.isDamageActiveAt({ col: 5, row: 6 })).toBe(true);
    expect(explosionSystem.isDamageActiveAt({ col: 1, row: 1 })).toBe(false);
  });

  it('UT-EXP-IFRAMES: isDamageActiveAt turns false after damage duration (0.4s)', () => {
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 5, row: 5 }, blastPower: 1 });
    explosionSystem.processExplosionBatch(bombSystem.update(3.0));

    expect(explosionSystem.isDamageActiveAt({ col: 5, row: 5 })).toBe(true);
    explosionSystem.update(0.4);
    expect(explosionSystem.isDamageActiveAt({ col: 5, row: 5 })).toBe(false);
  });

  it('UT-EXP-CLEANUP-IDEM: Idempotent Cleanup (Gọi cleanup nhiều lần không lỗi)', () => {
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 5, row: 5 }, blastPower: 1 });
    explosionSystem.processExplosionBatch(bombSystem.update(3.0));

    expect(explosionSystem.getActiveExplosionsCount()).toBe(1);
    explosionSystem.cleanup();
    expect(explosionSystem.getActiveExplosionsCount()).toBe(0);
    expect(() => explosionSystem.cleanup()).not.toThrow();
  });
});
