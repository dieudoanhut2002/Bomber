import Phaser from 'phaser';

/**
 * Tiện ích sinh Texture và Animation 4 hướng nội suy (Procedural Pixel Art)
 * cho nhân vật Bomber mà không phụ thuộc vào tải ảnh từ bên ngoài.
 */
export class PlayerTextureGenerator {
  public static readonly KEYS = {
    DOWN_0: 'player_down_0',
    DOWN_1: 'player_down_1',
    UP_0: 'player_up_0',
    UP_1: 'player_up_1',
    LEFT_0: 'player_left_0',
    LEFT_1: 'player_left_1',
    RIGHT_0: 'player_right_0',
    RIGHT_1: 'player_right_1',
  } as const;

  public static readonly ANIMS = {
    IDLE_DOWN: 'player-idle-down',
    WALK_DOWN: 'player-walk-down',
    IDLE_UP: 'player-idle-up',
    WALK_UP: 'player-walk-up',
    IDLE_LEFT: 'player-idle-left',
    WALK_LEFT: 'player-walk-left',
    IDLE_RIGHT: 'player-idle-right',
    WALK_RIGHT: 'player-walk-right',
  } as const;

  /**
   * Khởi tạo textures và đăng ký animation vào Phaser.Scene
   */
  public static generate(scene: Phaser.Scene): void {
    if (scene.textures.exists(this.KEYS.DOWN_0)) {
      return; // Đã sinh textures trước đó
    }

    // Vẽ từng frame 48x48 pixel
    this.createFrame(scene, this.KEYS.DOWN_0, 'DOWN', 0);
    this.createFrame(scene, this.KEYS.DOWN_1, 'DOWN', 1);
    this.createFrame(scene, this.KEYS.UP_0, 'UP', 0);
    this.createFrame(scene, this.KEYS.UP_1, 'UP', 1);
    this.createFrame(scene, this.KEYS.LEFT_0, 'LEFT', 0);
    this.createFrame(scene, this.KEYS.LEFT_1, 'LEFT', 1);
    this.createFrame(scene, this.KEYS.RIGHT_0, 'RIGHT', 0);
    this.createFrame(scene, this.KEYS.RIGHT_1, 'RIGHT', 1);

    // Đăng ký animations
    const anims = scene.anims;
    const rate = 8; // 8 FPS cho bước chân

    anims.create({
      key: this.ANIMS.IDLE_DOWN,
      frames: [{ key: this.KEYS.DOWN_0 }],
      frameRate: 1,
    });
    anims.create({
      key: this.ANIMS.WALK_DOWN,
      frames: [{ key: this.KEYS.DOWN_0 }, { key: this.KEYS.DOWN_1 }],
      frameRate: rate,
      repeat: -1,
    });

    anims.create({
      key: this.ANIMS.IDLE_UP,
      frames: [{ key: this.KEYS.UP_0 }],
      frameRate: 1,
    });
    anims.create({
      key: this.ANIMS.WALK_UP,
      frames: [{ key: this.KEYS.UP_0 }, { key: this.KEYS.UP_1 }],
      frameRate: rate,
      repeat: -1,
    });

    anims.create({
      key: this.ANIMS.IDLE_LEFT,
      frames: [{ key: this.KEYS.LEFT_0 }],
      frameRate: 1,
    });
    anims.create({
      key: this.ANIMS.WALK_LEFT,
      frames: [{ key: this.KEYS.LEFT_0 }, { key: this.KEYS.LEFT_1 }],
      frameRate: rate,
      repeat: -1,
    });

    anims.create({
      key: this.ANIMS.IDLE_RIGHT,
      frames: [{ key: this.KEYS.RIGHT_0 }],
      frameRate: 1,
    });
    anims.create({
      key: this.ANIMS.WALK_RIGHT,
      frames: [{ key: this.KEYS.RIGHT_0 }, { key: this.KEYS.RIGHT_1 }],
      frameRate: rate,
      repeat: -1,
    });
  }

  private static createFrame(
    scene: Phaser.Scene,
    key: string,
    direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
    step: number
  ): void {
    const g = scene.make.graphics({ x: 0, y: 0 });

    const cx = 24;
    const cy = 24;

    // 1. Thân áo xanh (Blue Body)
    g.fillStyle(0x2563eb, 1);
    g.fillRoundedRect(cx - 10, cy - 2, 20, 16, 4);

    // 2. Chân / Giày (Feet with stepping offset)
    g.fillStyle(0x1e293b, 1);
    const footOffset = step === 1 ? 2 : -2;
    if (direction === 'LEFT' || direction === 'RIGHT') {
      g.fillRoundedRect(cx - 8 + footOffset, cy + 12, 7, 7, 2);
      g.fillRoundedRect(cx + 1 - footOffset, cy + 12, 7, 7, 2);
    } else {
      g.fillRoundedRect(cx - 9, cy + 12 + footOffset, 7, 7, 2);
      g.fillRoundedRect(cx + 2, cy + 12 - footOffset, 7, 7, 2);
    }

    // 3. Mũ bảo hiểm trắng tròn (White Helmet Head)
    g.fillStyle(0xf8fafc, 1);
    g.fillCircle(cx, cy - 8, 12);
    g.lineStyle(1.5, 0x94a3b8, 1);
    g.strokeCircle(cx, cy - 8, 12);

    // 4. Khuôn mặt và Mắt theo hướng nhìn
    if (direction === 'DOWN') {
      // Mặt hồng hào
      g.fillStyle(0xfecdd3, 1);
      g.fillRoundedRect(cx - 7, cy - 10, 14, 8, 3);
      // Mắt
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(cx - 3, cy - 6, 1.5);
      g.fillCircle(cx + 3, cy - 6, 1.5);
    } else if (direction === 'UP') {
      // Phía sau mũ, vẽ anten/chỏm mũ nhỏ
      g.fillStyle(0xe2e8f0, 1);
      g.fillCircle(cx, cy - 17, 3);
    } else if (direction === 'LEFT') {
      // Nhìn nghiêng trái
      g.fillStyle(0xfecdd3, 1);
      g.fillRoundedRect(cx - 10, cy - 10, 11, 8, 3);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(cx - 6, cy - 6, 1.5);
    } else if (direction === 'RIGHT') {
      // Nhìn nghiêng phải
      g.fillStyle(0xfecdd3, 1);
      g.fillRoundedRect(cx - 1, cy - 10, 11, 8, 3);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(cx + 6, cy - 6, 1.5);
    }

    // 5. Tay / Đai lưng
    g.fillStyle(0xf59e0b, 1); // Đai vàng
    g.fillRect(cx - 8, cy + 6, 16, 3);

    g.generateTexture(key, 48, 48);
    g.destroy();
  }
}
