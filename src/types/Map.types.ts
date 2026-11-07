import { IGridCoord, TileType } from '@/types/Grid.types';

/**
 * Cấu trúc dữ liệu thuần túy đại diện cho trạng thái của một bản đồ
 */
export interface IGameMapData {
  readonly width: number;
  readonly height: number;
  readonly tiles: TileType[][]; // Dạng row-major: tiles[row][col]
  readonly playerSpawn: IGridCoord;
  readonly exitCoord: IGridCoord;
  readonly stage: number;
}

/**
 * Tùy chọn cấu hình khi sinh bản đồ tự động
 */
export interface IMapGeneratorOptions {
  stage?: number;
  softWallCount?: number;
  seed?: number | string;
  playerSpawn?: IGridCoord;
  customExitCoord?: IGridCoord;
}
