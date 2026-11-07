import Phaser from 'phaser';
import { SceneKey } from '@/types/Game.types';

/**
 * BootScene: Màn hình khởi tạo kỹ thuật đầu tiên của Phaser
 * Chịu trách nhiệm thiết lập cấu hình tỷ lệ và chuyển tiếp ngay sang PreloadScene
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.BOOT });
  }

  public preload(): void {
    // Không nạp tài nguyên nặng tại BootScene
  }

  public create(): void {
    // Chuyển tiếp ngay lập tức sang PreloadScene
    this.scene.start(SceneKey.PRELOAD);
  }
}
