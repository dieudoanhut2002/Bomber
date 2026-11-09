import { IGridCoord, TileType } from '@/types/Grid.types';
import { Direction } from '@/types/Player.types';
import { EnemyType, IEnemyData } from '@/types/Enemy.types';
import { GAME_DIMENSIONS } from '@/config/GridConfig';
import { GridSystem } from '@/systems/GridSystem';
import { BombSystem } from '@/systems/BombSystem';
import { ExplosionSystem } from '@/systems/ExplosionSystem';
import { Player } from '@/entities/Player';
import { GridMath } from '@/utils/GridMath';
import { EventBus } from '@/core/EventBus';
import { GameEvents } from '@/core/GameEvents';
import { SoundEffects } from '@/utils/SoundEffects';

/**
 * Hệ thống Quản lý Quái vật & Trí tuệ Nhân tạo (EnemySystem - Stage 5)
 * Hỗ trợ 2 loại quái cổ điển: Ballom (tuần tra ngẫu nhiên) và Oneal (săn đuổi người chơi khi thấy).
 * Quản lý va chạm quái - tia lửa (quái chết), quái - người (người mất mạng), và mở Cửa thoát hiểm.
 */
export class EnemySystem {
  private readonly gridSystem: GridSystem;
  private readonly bombSystem: BombSystem;
  private readonly enemies: Map<string, IEnemyData> = new Map();
  private nextEnemyIndex: number = 1;

  constructor(gridSystem: GridSystem, bombSystem: BombSystem) {
    this.gridSystem = gridSystem;
    this.bombSystem = bombSystem;
  }

  /**
   * Khởi tạo quái vật tại các vị trí an toàn xa vị trí người chơi
   */
  public spawnEnemiesForStage(stage: number = 1): void {
    this.enemies.clear();
    const spawnCoord = this.gridSystem.getPlayerSpawn();
    const { GRID_COLS, GRID_ROWS } = GAME_DIMENSIONS;

    const availableCoords: IGridCoord[] = [];
    for (let r = 1; r < GRID_ROWS - 1; r++) {
      for (let c = 1; c < GRID_COLS - 1; c++) {
        // Chỉ chọn ô sàn trống (EMPTY)
        if (this.gridSystem.getTile({ col: c, row: r }) === TileType.EMPTY) {
          // Cách người chơi ít nhất 4 ô Manhattan distance
          const dist = Math.abs(c - spawnCoord.col) + Math.abs(r - spawnCoord.row);
          if (dist >= 4) {
            availableCoords.push({ col: c, row: r });
          }
        }
      }
    }

    // Trộn ngẫu nhiên các tọa độ
    availableCoords.sort(() => Math.random() - 0.5);

    // Cấu hình số lượng quái theo stage
    const ballomCount = Math.min(3 + stage, 6);
    const onealCount = Math.min(1 + Math.floor(stage / 2), 3);

    let spawned = 0;
    // Sinh Ballom
    for (let i = 0; i < ballomCount && spawned < availableCoords.length; i++) {
      this.createEnemy('BALLOM', availableCoords[spawned++]);
    }
    // Sinh Oneal
    for (let i = 0; i < onealCount && spawned < availableCoords.length; i++) {
      this.createEnemy('ONEAL', availableCoords[spawned++]);
    }
  }

  private createEnemy(type: EnemyType, coord: IGridCoord): IEnemyData {
    const id = `enemy_${this.nextEnemyIndex++}_${type}`;
    const worldPos = GridMath.gridToWorld(coord);
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const initialDir = directions[Math.floor(Math.random() * directions.length)];

    const enemy: IEnemyData = {
      id,
      type,
      x: worldPos.x,
      y: worldPos.y,
      direction: initialDir,
      speed: type === 'BALLOM' ? 60 : 85,
      isAlive: true,
      scoreValue: type === 'BALLOM' ? 200 : 400,
      lastGridCoord: { ...coord },
    };

    this.enemies.set(id, enemy);
    return enemy;
  }

  /**
   * Cập nhật AI di chuyển, va chạm vật cản, và kiểm tra trúng tia lửa bom
   */
  public update(
    deltaSeconds: number,
    explosionSystem: ExplosionSystem,
    player: Player
  ): boolean {
    if (deltaSeconds <= 0 || this.enemies.size === 0) return false;

    const deadEnemyIds: string[] = [];
    let playerHit = false;

    const playerWorld = { x: player.x, y: player.y };
    const playerGrid = GridMath.worldToGrid(playerWorld);

    for (const enemy of this.enemies.values()) {
      if (!enemy.isAlive) continue;

      const currentGrid = GridMath.worldToGrid({ x: enemy.x, y: enemy.y });

      // 1. Kiểm tra tia lửa nổ có chạm vào quái không
      if (explosionSystem.isDamageActiveAt(currentGrid)) {
        enemy.isAlive = false;
        deadEnemyIds.push(enemy.id);
        SoundEffects.playEnemyDeath();
        EventBus.emit(GameEvents.ENEMY_KILLED, {
          enemyId: enemy.id,
          score: enemy.scoreValue,
        });
        continue;
      }

      // 2. Kiểm tra va chạm với Người chơi (khoảng cách tâm < 22px)
      const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (distToPlayer < 22) {
        playerHit = true;
      }

      // 3. Cập nhật AI di chuyển
      this.updateEnemyMovement(enemy, deltaSeconds, playerGrid);
    }

    // Dọn dẹp quái đã chết
    for (const id of deadEnemyIds) {
      this.enemies.delete(id);
    }

    // Nếu tiêu diệt hết quái vật -> mở Cửa thoát hiểm!
    if (deadEnemyIds.length > 0 && this.enemies.size === 0) {
      this.gridSystem.unlockExitDoor();
      SoundEffects.playVictory();
      EventBus.emit(GameEvents.ALL_ENEMIES_DEFEATED);
    }

    return playerHit;
  }

  private updateEnemyMovement(
    enemy: IEnemyData,
    deltaSeconds: number,
    playerGrid: IGridCoord
  ): void {
    const currentGrid = GridMath.worldToGrid({ x: enemy.x, y: enemy.y });
    const cellCenter = GridMath.gridToWorld(currentGrid);

    // Với Oneal: kiểm tra Line of Sight (tầm nhìn thẳng) tới Player trong phạm vi 4 ô
    if (enemy.type === 'ONEAL') {
      const sightDir = this.checkLineOfSight(currentGrid, playerGrid, 4);
      if (sightDir !== 'NONE') {
        enemy.direction = sightDir;
        enemy.speed = 100; // Tăng tốc khi săn lùng
      } else {
        enemy.speed = 85;
      }
    }

    // Tính toán bước di chuyển
    let dx = 0;
    let dy = 0;
    if (enemy.direction === 'UP') dy = -enemy.speed * deltaSeconds;
    else if (enemy.direction === 'DOWN') dy = enemy.speed * deltaSeconds;
    else if (enemy.direction === 'LEFT') dx = -enemy.speed * deltaSeconds;
    else if (enemy.direction === 'RIGHT') dx = enemy.speed * deltaSeconds;

    const nextX = enemy.x + dx;
    const nextY = enemy.y + dy;

    // Kiểm tra xem ô tiếp theo có đi được không
    const nextGrid = GridMath.worldToGrid({ x: nextX, y: nextY });
    const canMove = this.isEnemyWalkable(nextGrid);

    if (canMove) {
      enemy.x = nextX;
      enemy.y = nextY;

      // Căn chỉnh tâm khi chuyển hướng ở ngã tư
      if (
        (enemy.direction === 'UP' || enemy.direction === 'DOWN') &&
        Math.abs(enemy.x - cellCenter.x) > 2
      ) {
        enemy.x += (cellCenter.x - enemy.x) * 0.2;
      }
      if (
        (enemy.direction === 'LEFT' || enemy.direction === 'RIGHT') &&
        Math.abs(enemy.y - cellCenter.y) > 2
      ) {
        enemy.y += (cellCenter.y - enemy.y) * 0.2;
      }
    } else {
      // Bị chặn lại -> Snap về tâm ô hiện tại và chọn hướng mới
      enemy.x = cellCenter.x;
      enemy.y = cellCenter.y;
      enemy.direction = this.pickNewDirection(currentGrid, enemy.direction);
    }
  }

  private isEnemyWalkable(coord: IGridCoord): boolean {
    if (!this.gridSystem.isValidCoord(coord)) return false;
    const tile = this.gridSystem.getTile(coord);
    // Quái vật không đi xuyên tường cứng, gạch mềm hoặc bom
    if (
      tile === TileType.HARD_WALL ||
      tile === TileType.SOFT_BRICK ||
      tile === TileType.BOMB
    ) {
      return false;
    }
    if (this.bombSystem.isBombAt(coord)) {
      return false;
    }
    return true;
  }

  private pickNewDirection(current: IGridCoord, currentDir: Direction): Direction {
    const candidates: Direction[] = [];
    const checks: { dir: Direction; c: number; r: number }[] = [
      { dir: 'UP', c: current.col, r: current.row - 1 },
      { dir: 'DOWN', c: current.col, r: current.row + 1 },
      { dir: 'LEFT', c: current.col - 1, r: current.row },
      { dir: 'RIGHT', c: current.col + 1, r: current.row },
    ];

    for (const check of checks) {
      if (this.isEnemyWalkable({ col: check.c, row: check.r })) {
        candidates.push(check.dir);
      }
    }

    if (candidates.length === 0) {
      return 'NONE';
    }

    // Ưu tiên không quay đầu ngược lại trừ khi ngõ cụt
    const oppositeMap: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
      NONE: 'NONE',
    };
    const nonOpposite = candidates.filter((d) => d !== oppositeMap[currentDir]);
    if (nonOpposite.length > 0) {
      return nonOpposite[Math.floor(Math.random() * nonOpposite.length)];
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private checkLineOfSight(
    from: IGridCoord,
    to: IGridCoord,
    maxDistance: number
  ): Direction {
    if (from.col === to.col) {
      const dist = Math.abs(to.row - from.row);
      if (dist > 0 && dist <= maxDistance) {
        const step = to.row > from.row ? 1 : -1;
        let blocked = false;
        for (let r = from.row + step; r !== to.row; r += step) {
          if (!this.isEnemyWalkable({ col: from.col, row: r })) {
            blocked = true;
            break;
          }
        }
        if (!blocked) return to.row > from.row ? 'DOWN' : 'UP';
      }
    } else if (from.row === to.row) {
      const dist = Math.abs(to.col - from.col);
      if (dist > 0 && dist <= maxDistance) {
        const step = to.col > from.col ? 1 : -1;
        let blocked = false;
        for (let c = from.col + step; c !== to.col; c += step) {
          if (!this.isEnemyWalkable({ col: c, row: from.row })) {
            blocked = true;
            break;
          }
        }
        if (!blocked) return to.col > from.col ? 'RIGHT' : 'LEFT';
      }
    }
    return 'NONE';
  }

  public getEnemies(): ReadonlyArray<IEnemyData> {
    return Array.from(this.enemies.values());
  }

  public getAliveCount(): number {
    return this.enemies.size;
  }

  public cleanup(): void {
    this.enemies.clear();
  }
}
