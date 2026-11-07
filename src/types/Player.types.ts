import { IWorldPosition } from '@/types/Grid.types';

/**
 * Hướng di chuyển và hướng nhìn của nhân vật
 */
export type Direction = 'NONE' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/**
 * Cấu hình tham số vận hành của Player
 */
export interface IPlayerConfig {
  readonly BASE_SPEED: number;             // Tốc độ cơ bản: 120 px/s (theo GDD 3.1)
  readonly HITBOX_WIDTH: number;           // Chiều rộng Hitbox: 28px
  readonly HITBOX_HEIGHT: number;          // Chiều cao Hitbox: 28px
  readonly SPRITE_SIZE: number;            // Kích thước hiển thị Sprite: 48px
  readonly CORNER_SLIDE_THRESHOLD: number; // Ngưỡng hỗ trợ trượt góc: 14px (theo GDD 3.1)
}

/**
 * Cấu trúc hình chữ nhật AABB (Axis-Aligned Bounding Box) cho Hitbox
 */
export interface IHitboxAABB {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
}

/**
 * Trạng thái hiện tại của Player
 */
export interface IPlayerState {
  position: IWorldPosition;
  velocity: IWorldPosition;
  direction: Direction;
  facing: Direction;
  isMoving: boolean;
}
