import { IGridCoord, TileType } from '@/types/Grid.types';
import {
  CARDINAL_DIRECTIONS,
  IBlastRayResult,
  IExplosionSegment,
  IRaycastQueryContext,
} from '@/types/Explosion.types';
import { GridSystem } from '@/systems/GridSystem';
import { BombSystem } from '@/systems/BombSystem';

/**
 * Thuật toán Tính toán Vùng Nổ Chữ Thập (ExplosionRaycaster)
 * Tính toán thuần túy (Pure Query), không thay đổi trạng thái Grid hay Bom.
 * Tuân thủ ADR-013 Quyết định 2 (Penetrating Blast qua Bom) và GDD Mục 3.3.
 */
export class ExplosionRaycaster {
  private readonly gridSystem: GridSystem;
  private readonly bombSystem?: BombSystem;

  constructor(gridSystem: GridSystem, bombSystem?: BombSystem) {
    this.gridSystem = gridSystem;
    this.bombSystem = bombSystem;
  }

  /**
   * Tính toán các phân đoạn tia nổ theo 4 hướng trực giao
   * @param origin Tọa độ tâm vụ nổ
   * @param power Bán kính tia nổ (mặc định 1 ô theo GDD 3.3)
   * @param context Query context tùy chọn hỗ trợ Unit Testing và Dependency Injection
   */
  public calculateBlast(
    origin: IGridCoord,
    power: number,
    context?: IRaycastQueryContext
  ): IBlastRayResult {
    const queryCtx: IRaycastQueryContext = context ?? {
      isValidCoord: (coord: IGridCoord) => this.gridSystem.isValidCoord(coord),
      getTile: (coord: IGridCoord) => this.gridSystem.getTile(coord),
      getBombAt: (coord: IGridCoord) =>
        this.bombSystem ? this.bombSystem.getBombAt(coord) : null,
    };

    // Kiểm tra tọa độ gốc hợp lệ
    if (!queryCtx.isValidCoord(origin)) {
      return {
        origin: { ...origin },
        power,
        segments: [],
        destroyedBricks: [],
        triggeredBombs: [],
      };
    }

    // Clamp power tối thiểu là 1 theo GDD 3.3
    const clampedPower = Math.max(1, Math.floor(power));
    const segments: IExplosionSegment[] = [];
    const destroyedBricks: IGridCoord[] = [];
    const triggeredBombs: string[] = [];

    // 1. Phân đoạn Tâm (Center segment) luôn luôn xuất hiện tại origin
    segments.push({
      coord: { col: origin.col, row: origin.row },
      direction: 'CENTER',
      isTip: false,
      destroyedBrick: false,
    });

    // 2. Quét tia nổ theo 4 hướng trực giao (UP, DOWN, LEFT, RIGHT)
    for (const cardinal of CARDINAL_DIRECTIONS) {
      for (let step = 1; step <= clampedPower; step++) {
        const currentCoord: IGridCoord = {
          col: origin.col + cardinal.dCol * step,
          row: origin.row + cardinal.dRow * step,
        };

        // Dừng an toàn nếu chạm biên bản đồ
        if (!queryCtx.isValidCoord(currentCoord)) {
          break;
        }

        const tile = queryCtx.getTile(currentCoord);

        // Tường cứng (HARD_WALL): Chặn hoàn toàn tia nổ, không sinh segment trên tường
        if (tile === TileType.HARD_WALL) {
          break;
        }

        // Gạch mềm (SOFT_BRICK): Phá hủy gạch mềm, sinh segment Tip và dừng tia nổ
        if (tile === TileType.SOFT_BRICK) {
          destroyedBricks.push({ ...currentCoord });
          segments.push({
            coord: { ...currentCoord },
            direction: cardinal.dir,
            isTip: true,
            destroyedBrick: true,
          });
          break;
        }

        // Kiểm tra xem có bom ARMED tại ô này không
        const bombAtCell = queryCtx.getBombAt(currentCoord);
        if (bombAtCell && bombAtCell.state === 'ARMED') {
          if (!triggeredBombs.includes(bombAtCell.id)) {
            triggeredBombs.push(bombAtCell.id);
          }
        }

        // Ô trống hoặc ô chứa bom/cửa: Sinh segment và tiếp tục lan truyền (Penetrating Blast)
        const isTip = step === clampedPower;
        segments.push({
          coord: { ...currentCoord },
          direction: cardinal.dir,
          isTip,
          destroyedBrick: false,
        });
      }
    }

    return {
      origin: { ...origin },
      power: clampedPower,
      segments,
      destroyedBricks,
      triggeredBombs,
    };
  }
}
