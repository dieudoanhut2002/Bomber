/**
 * Định nghĩa kiểu dữ liệu cho hệ thống Lưới ma trận (Grid System)
 */

export enum TileType {
  EMPTY = 0,
  HARD_WALL = 1,
  SOFT_BRICK = 2,
  BOMB = 3,
  EXIT_DOOR_LOCKED = 4,
  EXIT_DOOR_OPEN = 5,
}

export interface IGridCoord {
  col: number; // 0 đến 14 (15 cột)
  row: number; // 0 đến 12 (13 hàng)
}

export interface IWorldPosition {
  x: number;
  y: number;
}
