import { IBombConfig } from '@/types/Bomb.types';

/**
 * Cấu hình tập trung cho Phân hệ Bom (Bomb Core System)
 * Tuân thủ theo Game Design Document (GDD mục 3.2) và ADR-013.
 * Hoàn toàn độc lập với Phaser, hỗ trợ kiểm thử Headless.
 */
export const BOMB_CONFIG: Readonly<IBombConfig> = {
  DEFAULT_FUSE_DURATION: 3.0, // Thời gian đếm ngược mặc định 3.0 giây
  DEFAULT_BLAST_POWER: 1,     // Bán kính tia lửa mặc định 1 ô
  DEFAULT_BOMB_CAPACITY: 1,   // Số lượng bom tối đa mặc định 1 quả cùng lúc
  MIN_BLAST_POWER: 1,         // Bán kính tối thiểu hợp lệ là 1 ô
  MAX_BLAST_POWER: 10,        // Bán kính tối đa cho phép
  MIN_FUSE_DURATION: 0.1,     // Thời gian đếm ngược tối thiểu hợp lệ
  MAX_FUSE_DURATION: 10.0,    // Thời gian đếm ngược tối đa cho phép
};
