import { IGridCoord, IWorldPosition } from '@/types/Grid.types';
import { GAME_DIMENSIONS } from '@/config/GridConfig';

/**
 * Tiện ích toán học xử lý chuyển đổi giữa Hệ tọa độ Thế giới (Pixel X, Y)
 * và Hệ tọa độ Lưới ma trận (Col, Row).
 */
export class GridMath {
  /**
   * Chuyển đổi tọa độ ô lưới sang tọa độ tâm ô trong không gian thế giới (Pixel)
   * Lưu ý: trục Y được cộng thêm HUD_HEIGHT (48px) vì thanh HUD chiếm phần trên cùng.
   */
  public static gridToWorld(coord: IGridCoord): IWorldPosition {
    const halfTile = GAME_DIMENSIONS.TILE_SIZE / 2;
    return {
      x: coord.col * GAME_DIMENSIONS.TILE_SIZE + halfTile,
      y: GAME_DIMENSIONS.HUD_HEIGHT + coord.row * GAME_DIMENSIONS.TILE_SIZE + halfTile,
    };
  }

  /**
   * Chuyển đổi tọa độ thế giới (Pixel X, Y) về chỉ số ô lưới (Col, Row)
   */
  public static worldToGrid(pos: IWorldPosition): IGridCoord {
    const col = Math.floor(pos.x / GAME_DIMENSIONS.TILE_SIZE);
    const row = Math.floor((pos.y - GAME_DIMENSIONS.HUD_HEIGHT) / GAME_DIMENSIONS.TILE_SIZE);
    return { col, row };
  }

  /**
   * Kiểm tra tọa độ ô lưới có nằm trong phạm vi hợp lệ của bản đồ hay không
   */
  public static isValidGridCoord(coord: IGridCoord): boolean {
    return (
      coord.col >= 0 &&
      coord.col < GAME_DIMENSIONS.GRID_COLS &&
      coord.row >= 0 &&
      coord.row < GAME_DIMENSIONS.GRID_ROWS
    );
  }

  /**
   * Tự động căn chỉnh tọa độ bất kỳ về tâm ô lưới tương ứng (thuần túy toán học)
   * Giữ nguyên ngữ nghĩa toán học: không clamp nếu tọa độ nằm ngoài biên (F-03).
   */
  public static snapToGridCenter(pos: IWorldPosition): IWorldPosition {
    const gridCoord = this.worldToGrid(pos);
    return this.gridToWorld(gridCoord);
  }

  /**
   * Giới hạn tọa độ ô lưới trong phạm vi hợp lệ của bản đồ [0, COLS-1] và [0, ROWS-1]
   */
  public static clampGridCoord(coord: IGridCoord): IGridCoord {
    return {
      col: Math.max(0, Math.min(coord.col, GAME_DIMENSIONS.GRID_COLS - 1)),
      row: Math.max(0, Math.min(coord.row, GAME_DIMENSIONS.GRID_ROWS - 1)),
    };
  }

  /**
   * Căn chỉnh tọa độ về tâm ô lưới và giới hạn an toàn trong vùng chơi (F-03)
   * Ngăn chặn việc đối tượng bị snap vào khu vực HUD hoặc ngoài biên bản đồ.
   */
  public static clampAndSnapToGrid(pos: IWorldPosition): IWorldPosition {
    const gridCoord = this.worldToGrid(pos);
    const clamped = this.clampGridCoord(gridCoord);
    return this.gridToWorld(clamped);
  }
}
