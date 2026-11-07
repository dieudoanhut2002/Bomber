import Phaser from 'phaser';
import { SceneKey } from '@/types/Game.types';

/**
 * PreloadScene: Màn hình nạp tài nguyên và chuyển tiếp sang GameScene
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.PRELOAD });
  }

  public preload(): void {
    // Tài nguyên âm thanh/hình ảnh sẽ được bổ sung ở các Stage tiếp theo
  }

  public create(): void {
    // Chuyển tiếp ngay sang GameScene để hiển thị bản đồ Stage 2B
    this.scene.start(SceneKey.GAME);
  }
}
