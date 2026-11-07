import { IPlayerConfig } from '@/types/Player.types';

/**
 * Hằng số cấu hình chuẩn mực của Player theo GDD và Kiến trúc
 */
export const PLAYER_CONFIG: Readonly<IPlayerConfig> = {
  BASE_SPEED: 120,             // 120 pixel/giây (chuẩn Bomberman Arcade)
  HITBOX_WIDTH: 28,            // 28px căn giữa trên Tile 48px
  HITBOX_HEIGHT: 28,           // 28px căn giữa trên Tile 48px
  SPRITE_SIZE: 48,             // 48x48 pixel
  CORNER_SLIDE_THRESHOLD: 14,  // Ngưỡng trượt góc 14px (theo GDD mục 3.1)
};

/**
 * Khoảng thụt lề (Offset) để căn chính xác Hitbox 28x28 vào giữa Sprite 48x48
 * Offset = (48 - 28) / 2 = 10px
 */
export const PLAYER_HITBOX_OFFSET = {
  x: (PLAYER_CONFIG.SPRITE_SIZE - PLAYER_CONFIG.HITBOX_WIDTH) / 2,  // 10px
  y: (PLAYER_CONFIG.SPRITE_SIZE - PLAYER_CONFIG.HITBOX_HEIGHT) / 2, // 10px
};
