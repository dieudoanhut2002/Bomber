import { IGridCoord } from '@/types/Grid.types';

/**
 * Trạng thái vòng đời của một quả bom (Bomb Lifecycle State Machine)
 * - ARMED: Bom đã được đặt thành công và đang đếm ngược thời gian nổ (Ticking).
 * - TRIGGERED: Bom được kích nổ sớm bởi một tác nhân bên ngoài (chuẩn bị nổ ngay ở frame tiếp theo).
 * - EXPLODING: Bom đang phát nổ, giải phóng capacity và ô lưới trên GridSystem.
 * - FINISHED: Vòng đời của bom đã kết thúc hoàn toàn, dọn dẹp khỏi bộ nhớ.
 */
export type BombState = 'ARMED' | 'TRIGGERED' | 'EXPLODING' | 'FINISHED';

/**
 * Cấu hình tham số của hệ thống Bom
 */
export interface IBombConfig {
  readonly DEFAULT_FUSE_DURATION: number; // Mặc định 3.0 giây
  readonly DEFAULT_BLAST_POWER: number;    // Mặc định 1 ô
  readonly DEFAULT_BOMB_CAPACITY: number;  // Mặc định 1 quả cùng lúc
  readonly MIN_BLAST_POWER: number;        // Tối thiểu 1 ô
  readonly MAX_BLAST_POWER: number;        // Tối đa 10 ô (sau khi nhặt Power-up)
  readonly MIN_FUSE_DURATION: number;      // Tối thiểu 0.1 giây
  readonly MAX_FUSE_DURATION: number;      // Tối đa 10.0 giây
}

/**
 * Dữ liệu đại diện của một quả bom trong Gameplay Logic (độc lập với Phaser)
 */
export interface IBombData {
  readonly id: string;
  readonly ownerId: string;
  readonly coord: IGridCoord;
  readonly blastPower: number;
  readonly fuseDuration: number;
  remainingTime: number;
  state: BombState;
  readonly createdAt: number;
}

/**
 * Tùy chọn truyền vào khi yêu cầu đặt bom
 */
export interface IPlaceBombOptions {
  ownerId: string;
  coord: IGridCoord;
  blastPower?: number;
  fuseDuration?: number;
}

/**
 * Trạng thái quản lý chủ sở hữu bom (Owner Profile)
 */
export interface IBombOwnerState {
  ownerId: string;
  capacity: number;
  activeCount: number;
}
