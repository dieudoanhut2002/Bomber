/**
 * Định nghĩa kiểu dữ liệu chung và khóa định danh cho Game
 */

export enum SceneKey {
  BOOT = 'BootScene',
  PRELOAD = 'PreloadScene',
  MENU = 'MenuScene',
  GAME = 'GameScene',
  UI = 'UIScene',
  GAME_OVER = 'GameOverScene',
}

export interface IGameDimensions {
  readonly TILE_SIZE: number;
  readonly GRID_COLS: number;
  readonly GRID_ROWS: number;
  readonly HUD_HEIGHT: number;
  readonly WIDTH: number;
  readonly HEIGHT: number;
}
