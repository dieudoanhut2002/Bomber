import { IGridCoord } from '@/types/Grid.types';
import { IBombData } from '@/types/Bomb.types';
import {
  ICellExplosionState,
  IExplosionContribution,
  IExplosionData,
} from '@/types/Explosion.types';
import { GridSystem } from '@/systems/GridSystem';
import { BombSystem } from '@/systems/BombSystem';
import { ExplosionRaycaster } from '@/systems/ExplosionRaycaster';
import { EventBus } from '@/core/EventBus';
import { GameEvents } from '@/core/GameEvents';

/**
 * Hệ thống Quản lý Vụ Nổ & Phản Ứng Dây Chuyền (ExplosionSystem)
 * Chịu trách nhiệm thực thi BFS Batch Processing, quản lý thời lượng vụ nổ (Authoritative Master),
 * và theo dõi chồng lấn ô lưới (Cell-based Visual Stacking theo ADR-013 Quyết định 3).
 */
export class ExplosionSystem {
  private readonly gridSystem: GridSystem;
  private readonly bombSystem: BombSystem;
  private readonly raycaster: ExplosionRaycaster;

  private readonly activeExplosions: Map<string, IExplosionData> = new Map();
  private readonly cellExplosionMap: Map<string, ICellExplosionState> = new Map();
  private nextExplosionIndex: number = 1;

  constructor(
    gridSystem: GridSystem,
    bombSystem: BombSystem,
    raycaster?: ExplosionRaycaster
  ) {
    this.gridSystem = gridSystem;
    this.bombSystem = bombSystem;
    this.raycaster = raycaster ?? new ExplosionRaycaster(gridSystem, bombSystem);
  }

  /**
   * Xử lý một mẻ các quả bom phát nổ đồng thời theo thuật toán BFS phi đệ quy (ADR-013 Quyết định 2)
   */
  public processExplosionBatch(rootBombs: IBombData[]): IExplosionData[] {
    if (!rootBombs || rootBombs.length === 0) {
      return [];
    }

    const createdExplosions: IExplosionData[] = [];
    const batchProcessedBombIds: Set<string> = new Set();
    const queue: IBombData[] = [];
    let head = 0;

    // Nạp các quả bom gốc ban đầu vào hàng đợi BFS
    for (const root of rootBombs) {
      if (!batchProcessedBombIds.has(root.id)) {
        queue.push(root);
      }
    }

    // Vòng lặp BFS trỏ Head Index (độ phức tạp O(N * P) không tốn chi phí shift)
    while (head < queue.length) {
      const currentBomb = queue[head++];
      if (batchProcessedBombIds.has(currentBomb.id)) {
        continue;
      }
      batchProcessedBombIds.add(currentBomb.id);

      // 1. Tính toán tia nổ bằng Raycaster
      const blastResult = this.raycaster.calculateBlast(
        currentBomb.coord,
        currentBomb.blastPower
      );

      // 2. Phá hủy gạch mềm trên GridSystem (chỉ lần đầu trả về true mới bắn BLOCK_DESTROYED - OD-05)
      for (const brickCoord of blastResult.destroyedBricks) {
        if (this.gridSystem.destroySoftWall(brickCoord)) {
          EventBus.emit(GameEvents.BLOCK_DESTROYED, {
            col: brickCoord.col,
            row: brickCoord.row,
          });
        }
      }

      // 3. Xử lý kích nổ dây chuyền cho các quả bom nằm trong tầm nổ (ADR-013 Quyết định 2)
      for (const triggeredBombId of blastResult.triggeredBombs) {
        if (!batchProcessedBombIds.has(triggeredBombId)) {
          const triggeredBomb = this.bombSystem.explodeImmediately(triggeredBombId);
          if (triggeredBomb) {
            queue.push(triggeredBomb);
          }
        }
      }

      // 4. Tạo Master Explosion Data (Single Source of Truth - DT-05)
      const explosionId = `exp_${this.nextExplosionIndex++}_${currentBomb.id}`;
      const explosionData: IExplosionData = {
        id: explosionId,
        bombId: currentBomb.id,
        ownerId: currentBomb.ownerId,
        center: { ...currentBomb.coord },
        power: currentBomb.blastPower,
        segments: blastResult.segments,
        damageRemainingTime: 0.4, // Baseline requirement GDD 3.3
        visualRemainingTime: 0.4, // Baseline requirement GDD 3.3
        affectedBricks: blastResult.destroyedBricks,
      };

      this.activeExplosions.set(explosionId, explosionData);
      createdExplosions.push(explosionData);

      // 5. Đăng ký các segment vào Cell Explosion Map (Visual Stacking theo ADR-013 Quyết định 3)
      for (const segment of blastResult.segments) {
        const key = this.getCoordKey(segment.coord);
        let cellState = this.cellExplosionMap.get(key);
        if (!cellState) {
          cellState = {
            coord: { ...segment.coord },
            contributions: new Map(),
          };
          this.cellExplosionMap.set(key, cellState);
        }

        const contribution: IExplosionContribution = {
          explosionId,
          bombId: currentBomb.id,
          ownerId: currentBomb.ownerId,
          direction: segment.direction,
          isTip: segment.isTip,
        };
        cellState.contributions.set(explosionId, contribution);
      }

      // 6. Bắn sự kiện EXPLOSION_CREATED qua EventBus
      EventBus.emit(GameEvents.EXPLOSION_CREATED, {
        explosionId,
        bombId: currentBomb.id,
        ownerId: currentBomb.ownerId,
        center: { ...currentBomb.coord },
        power: currentBomb.blastPower,
        segments: blastResult.segments,
        affectedBricks: blastResult.destroyedBricks,
        triggeredBombIds: blastResult.triggeredBombs,
      });
    }

    return createdExplosions;
  }

  /**
   * Cập nhật đếm ngược thời lượng của tất cả các vụ nổ đang hoạt động
   * Dọn dẹp các vụ nổ hết giờ và kích hoạt BOMB_FINISHED.
   */
  public update(deltaSeconds: number): string[] {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return [];
    }

    const finishedExplosionIds: string[] = [];

    // 1. Cập nhật đếm lùi thời lượng Master State
    for (const explosion of this.activeExplosions.values()) {
      explosion.damageRemainingTime = Math.max(0, explosion.damageRemainingTime - deltaSeconds);
      explosion.visualRemainingTime -= deltaSeconds;

      if (explosion.visualRemainingTime <= 0) {
        finishedExplosionIds.push(explosion.id);
      }
    }

    // 2. Dọn dẹp các vụ nổ đã hết thời lượng
    for (const explosionId of finishedExplosionIds) {
      const explosion = this.activeExplosions.get(explosionId);
      if (!explosion) continue;

      // Xóa các contribution của vụ nổ này khỏi từng cell
      for (const segment of explosion.segments) {
        const key = this.getCoordKey(segment.coord);
        const cellState = this.cellExplosionMap.get(key);
        if (cellState) {
          cellState.contributions.delete(explosionId);
          if (cellState.contributions.size === 0) {
            this.cellExplosionMap.delete(key);
          }
        }
      }

      this.activeExplosions.delete(explosionId);

      // Bắn sự kiện EXPLOSION_FINISHED
      EventBus.emit(GameEvents.EXPLOSION_FINISHED, {
        explosionId: explosion.id,
        bombId: explosion.bombId,
        ownerId: explosion.ownerId,
        affectedCells: explosion.segments.map((s) => ({ ...s.coord })),
      });

      // Hoàn tất chu trình của quả bom trên BombSystem
      this.bombSystem.finishBomb(explosion.bombId);
    }

    return finishedExplosionIds;
  }

  /**
   * Kiểm tra xem tại ô lưới chỉ định có sát thương hiệu lực hay không (damageRemainingTime > 0)
   * Sử dụng độc quyền cho Gameplay Hazard Overlap Detection (DT-05)
   */
  public isDamageActiveAt(coord: IGridCoord): boolean {
    const key = this.getCoordKey(coord);
    const cellState = this.cellExplosionMap.get(key);
    if (!cellState || cellState.contributions.size === 0) {
      return false;
    }

    // Tra cứu trạng thái từ Master IExplosionData
    for (const explosionId of cellState.contributions.keys()) {
      const explosion = this.activeExplosions.get(explosionId);
      if (explosion && explosion.damageRemainingTime > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Kiểm tra xem tại ô lưới chỉ định có đang hiển thị ngọn lửa hay không (visualRemainingTime > 0)
   */
  public isVisualActiveAt(coord: IGridCoord): boolean {
    const key = this.getCoordKey(coord);
    const cellState = this.cellExplosionMap.get(key);
    return !!cellState && cellState.contributions.size > 0;
  }

  /**
   * Phương thức tương thích ngược, ủy quyền 100% sang isVisualActiveAt (DT-05)
   */
  public isExplosionAt(coord: IGridCoord): boolean {
    return this.isVisualActiveAt(coord);
  }

  /**
   * Lấy danh sách ID các vụ nổ đang bao phủ ô lưới chỉ định
   */
  public getExplosionIdsAt(coord: IGridCoord): string[] {
    const key = this.getCoordKey(coord);
    const cellState = this.cellExplosionMap.get(key);
    return cellState ? Array.from(cellState.contributions.keys()) : [];
  }

  /**
   * Lấy thông tin chi tiết một vụ nổ theo ID
   */
  public getExplosionById(explosionId: string): IExplosionData | null {
    const exp = this.activeExplosions.get(explosionId);
    return exp ? { ...exp, segments: [...exp.segments] } : null;
  }

  /**
   * Lấy danh sách bản chụp bất biến tất cả các vụ nổ đang hoạt động
   */
  public getActiveExplosions(): ReadonlyArray<IExplosionData> {
    return Array.from(this.activeExplosions.values());
  }

  /**
   * Lấy tổng số lượng vụ nổ đang hoạt động
   */
  public getActiveExplosionsCount(): number {
    return this.activeExplosions.size;
  }

  /**
   * Dọn dẹp toàn bộ dữ liệu quản lý vụ nổ (Idempotent cleanup)
   */
  public cleanup(): void {
    this.activeExplosions.clear();
    this.cellExplosionMap.clear();
  }

  private getCoordKey(coord: IGridCoord): string {
    return `${coord.col},${coord.row}`;
  }
}
