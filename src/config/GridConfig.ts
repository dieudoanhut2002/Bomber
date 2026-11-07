import { IGameDimensions } from '@/types/Game.types';

/**
 * Hằng số kích thước chuẩn mực của Lưới và Sàn đấu Bomber
 * Hoàn toàn độc lập với Phaser, hỗ trợ kiểm thử Headless siêu tốc
 */
export const GAME_DIMENSIONS: IGameDimensions = {
  TILE_SIZE: 48,
  GRID_COLS: 15,
  GRID_ROWS: 13,
  HUD_HEIGHT: 48,
  WIDTH: 720,  // 15 cột * 48px = 720px
  HEIGHT: 672, // 13 hàng * 48px (624px) + 48px HUD = 672px
};
