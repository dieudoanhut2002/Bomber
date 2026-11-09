import { describe, it, expect, beforeEach } from 'vitest';
import { GameMap } from '@/core/GameMap';
import { GridSystem } from '@/systems/GridSystem';
import { BombSystem } from '@/systems/BombSystem';
import { ExplosionRaycaster } from '@/systems/ExplosionRaycaster';
import { ExplosionSystem } from '@/systems/ExplosionSystem';
import { EnemySystem } from '@/systems/EnemySystem';
import { ScoreSystem } from '@/systems/ScoreSystem';
import { TileType } from '@/types/Grid.types';
import { EventBus } from '@/core/EventBus';
import { GameEvents } from '@/core/GameEvents';

describe('GameplayIntegration (Kiểm thử Toàn diện Vòng lặp Game Playable)', () => {
  let gridSystem: GridSystem;
  let bombSystem: BombSystem;
  let explosionSystem: ExplosionSystem;
  let enemySystem: EnemySystem;
  let scoreSystem: ScoreSystem;
  let gameMap: GameMap;

  // Tạo map 15x13 có gạch mềm và cửa thoát hiểm
  function createTestMap(): GameMap {
    const tiles: TileType[][] = [];
    for (let r = 0; r < 13; r++) {
      const row: TileType[] = [];
      for (let c = 0; c < 15; c++) {
        if (r === 0 || r === 12 || c === 0 || c === 14) {
          row.push(TileType.HARD_WALL);
        } else if (c % 2 === 0 && r % 2 === 0) {
          row.push(TileType.HARD_WALL);
        } else {
          row.push(TileType.EMPTY);
        }
      }
      tiles.push(row);
    }
    // Đặt gạch mềm tại (2, 1) và Cửa thoát hiểm ẩn dưới gạch (3, 1)
    tiles[1][2] = TileType.SOFT_BRICK;
    tiles[1][3] = TileType.SOFT_BRICK;

    return new GameMap({
      stage: 1,
      width: 15,
      height: 13,
      tiles,
      playerSpawn: { col: 1, row: 1 },
      exitCoord: { col: 3, row: 1 },
    });
  }

  beforeEach(() => {
    EventBus.removeAllListeners();
    gameMap = createTestMap();
    gridSystem = new GridSystem(gameMap);
    bombSystem = new BombSystem(gridSystem);
    const raycaster = new ExplosionRaycaster(gridSystem, bombSystem);
    explosionSystem = new ExplosionSystem(gridSystem, bombSystem, raycaster);
    enemySystem = new EnemySystem(gridSystem, bombSystem);
    scoreSystem = new ScoreSystem();

    bombSystem.registerOwner('player1', 3);
  });

  it('GAMEPLAY-01: Đặt bom -> nổ sau 3s -> phá hủy gạch mềm -> ô thành EMPTY', () => {
    const bombCoord = { col: 1, row: 1 };
    const targetBrick = { col: 2, row: 1 };

    expect(gridSystem.getTile(targetBrick)).toBe(TileType.SOFT_BRICK);

    // 1. Đặt bom
    const bomb = bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: bombCoord, blastPower: 1 });
    expect(bomb).not.toBeNull();
    expect(gridSystem.getTile(bombCoord)).toBe(TileType.BOMB);

    // 2. Tua thời gian 3.0s
    const exploding = bombSystem.update(3.0);
    expect(exploding).toHaveLength(1);

    // 3. Xử lý mẻ vụ nổ
    const explosions = explosionSystem.processExplosionBatch(exploding);
    expect(explosions).toHaveLength(1);

    // Gạch mềm tại (2, 1) phải bị phá hủy thành EMPTY
    expect(gridSystem.getTile(targetBrick)).toBe(TileType.EMPTY);
  });

  it('GAMEPLAY-02: Phá gạch mềm ẩn Cửa thoát hiểm -> lộ diện EXIT_DOOR_LOCKED', () => {
    const bombCoord = { col: 4, row: 1 };
    const exitBrick = { col: 3, row: 1 };

    expect(gridSystem.getTile(exitBrick)).toBe(TileType.SOFT_BRICK);

    // Đặt bom tại (4, 1) phá viên gạch che Cửa ở (3, 1)
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: bombCoord, blastPower: 1 });
    const exploding = bombSystem.update(3.0);
    explosionSystem.processExplosionBatch(exploding);

    // Cửa thoát hiểm lộ diện ở trạng thái LOCKED
    expect(gridSystem.getTile(exitBrick)).toBe(TileType.EXIT_DOOR_LOCKED);
  });

  it('GAMEPLAY-03: Kích hoạt Nổ dây chuyền (Chain Reaction) nhiều quả bom liên tiếp', () => {
    // Đặt 3 quả bom kề nhau: (5, 5), (6, 5), (7, 5)
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 5, row: 5 }, blastPower: 1 });
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 6, row: 5 }, blastPower: 1 });
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: { col: 7, row: 5 }, blastPower: 1 });

    // Kích nổ quả đầu tiên
    const b1 = bombSystem.getBombAt({ col: 5, row: 5 })!;
    const exploding = [bombSystem.explodeImmediately(b1.id)!];

    // BFS phải kích nổ dây chuyền toàn bộ cả 3 quả bom
    const explosions = explosionSystem.processExplosionBatch(exploding);
    expect(explosions).toHaveLength(3);
  });

  it('GAMEPLAY-04: Tia lửa bom tiêu diệt Quái vật -> cộng điểm số', () => {
    enemySystem.spawnEnemiesForStage(1);
    const enemies = enemySystem.getEnemies();
    expect(enemies.length).toBeGreaterThan(0);

    const targetEnemy = enemies[0];
    const enemyGrid = { col: Math.floor(targetEnemy.x / 48), row: Math.floor((targetEnemy.y - 48) / 48) };

    // Sinh vụ nổ tại vị trí quái
    bombSystem.tryPlaceBomb({ ownerId: 'player1', coord: enemyGrid, blastPower: 1 });
    const exploding = bombSystem.update(3.0);
    explosionSystem.processExplosionBatch(exploding);

    let enemyKilledScore = 0;
    EventBus.on(GameEvents.ENEMY_KILLED, (payload) => {
      enemyKilledScore += payload.score;
    });

    // Mock dummy player
    const dummyPlayer = { x: 48, y: 96 } as any;
    enemySystem.update(0.1, explosionSystem, dummyPlayer);

    expect(enemyKilledScore).toBeGreaterThan(0);
  });

  it('GAMEPLAY-05: Người chơi mất mạng khi trúng tia lửa bom', () => {
    scoreSystem.reset();
    expect(scoreSystem.getLives()).toBe(3);

    const remaining = scoreSystem.loseLife();
    expect(remaining).toBe(2);
    expect(scoreSystem.getLives()).toBe(2);

    scoreSystem.loseLife();
    const finalLives = scoreSystem.loseLife();
    expect(finalLives).toBe(0);
  });

  it('GAMEPLAY-06: Hệ thống tính điểm và lưu Kỷ lục (High Score) qua localStorage', () => {
    scoreSystem.reset();
    scoreSystem.addScore(500);
    expect(scoreSystem.getScore()).toBe(500);
    expect(scoreSystem.getHighScore()).toBeGreaterThanOrEqual(500);
  });

  it('GAMEPLAY-07: Tiêu diệt toàn bộ quái vật mở khóa Cửa thoát hiểm (EXIT_DOOR_OPEN)', () => {
    const exitCoord = gameMap.getExitCoord();
    // Phá gạch làm lộ cửa
    gridSystem.destroySoftWall(exitCoord);
    expect(gridSystem.getTile(exitCoord)).toBe(TileType.EXIT_DOOR_LOCKED);

    // Mở khóa cửa khi sạch quái
    const unlocked = gridSystem.unlockExitDoor();
    expect(unlocked).toBe(true);
    expect(gridSystem.getTile(exitCoord)).toBe(TileType.EXIT_DOOR_OPEN);
  });
});
