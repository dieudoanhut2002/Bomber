import Phaser from 'phaser';
import { SceneKey } from '@/types/Game.types';
import { TileType } from '@/types/Grid.types';
import { GAME_DIMENSIONS } from '@/config/GridConfig';
import { BOMB_CONFIG } from '@/config/BombConfig';
import { GridMath } from '@/utils/GridMath';
import { MapGenerator } from '@/systems/MapGenerator';
import { GridSystem } from '@/systems/GridSystem';
import { BombSystem } from '@/systems/BombSystem';
import { PlayerCollisionSystem } from '@/systems/PlayerCollisionSystem';
import { PlayerInputSystem } from '@/systems/PlayerInputSystem';
import { PlayerTextureGenerator } from '@/utils/PlayerTextureGenerator';
import { Player } from '@/entities/Player';

/**
 * GameScene: Màn hình chính tích hợp Grid & Map System và Player Entity (Stage 2C)
 * Hỗ trợ điều khiển bàn phím (WASD / Mũi tên), di chuyển mượt mà và Corner Sliding.
 */
export class GameScene extends Phaser.Scene {
  private gridSystem!: GridSystem;
  private bombSystem!: BombSystem;
  private collisionSystem!: PlayerCollisionSystem;
  private inputSystem!: PlayerInputSystem;
  private player!: Player;

  // Bombs Visual Marker
  private bombGraphics!: Phaser.GameObjects.Graphics;

  // Debug Graphics
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private isDebugMode: boolean = false;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKey.GAME });
  }

  public create(): void {
    // 1. Sinh các Frame và Hoạt ảnh Procedural cho Player
    PlayerTextureGenerator.generate(this);

    // 2. Khởi tạo GridSystem từ MapGenerator
    const gameMap = MapGenerator.generate({ stage: 1, seed: 'STAGE_2C_VERIFY' });
    this.gridSystem = new GridSystem(gameMap);

    // 3. Khởi tạo BombSystem liên kết GridSystem
    this.bombSystem = new BombSystem(this.gridSystem);

    // 4. Khởi tạo Hệ thống va chạm độc lập (liên kết GridSystem và BombSystem)
    this.collisionSystem = new PlayerCollisionSystem(this.gridSystem, this.bombSystem);

    // 5. Khởi tạo Hệ thống Input
    this.inputSystem = new PlayerInputSystem(this);

    // 6. Render HUD và Bản đồ nền
    this.renderHUD();
    this.renderMap();

    // 7. Layer đồ họa hiển thị Bom (đặt dưới Player, trên sàn đấu)
    this.bombGraphics = this.add.graphics().setDepth(5);

    // 8. Khởi tạo Player tại vị trí Spawn của bản đồ
    const spawnCoord = this.gridSystem.getPlayerSpawn(); // (1, 1)
    const spawnWorld = GridMath.gridToWorld(spawnCoord);
    this.player = new Player(this, spawnWorld.x, spawnWorld.y, this.collisionSystem);
    this.player.setBombSystem(this.bombSystem);
    this.player.setDepth(10);

    // 9. Đăng ký Player làm Owner trong BombSystem với Capacity chuẩn
    this.bombSystem.registerOwner(this.player.getId(), BOMB_CONFIG.DEFAULT_BOMB_CAPACITY);

    // 10. Đăng ký dọn dẹp tài nguyên khi Scene shutdown/destroy
    this.events.once('shutdown', () => this.bombSystem.cleanup());
    this.events.once('destroy', () => this.bombSystem.cleanup());

    // 11. Thiết lập công cụ Debug Mode (Nhấn phím 'H' để bật/tắt hiển thị Hitbox 28x28)
    this.setupDebugTools();
  }

  public override update(_time: number, delta: number): void {
    if (!this.player || !this.inputSystem || !this.bombSystem) return;

    // Chuyển đổi delta từ miligiây sang giây (đảm bảo độc lập frame rate)
    // AUD-04: Clamp deltaSeconds tối đa 0.1s (100ms) để ngăn chặn lag spike / tab switch loop
    const deltaSeconds = Math.min(Math.max(0, delta / 1000), 0.1);

    // 1. Xử lý Input đặt bom (Spacebar JustDown)
    if (this.inputSystem.isBombJustPressed()) {
      this.player.tryDropBomb();
    }

    // 2. Cập nhật BombSystem đếm ngược fuse
    this.bombSystem.update(deltaSeconds);

    // 3. Cập nhật di chuyển cho Player (kèm Corner Sliding và kiểm tra Pass-through)
    const direction = this.inputSystem.getDirection();
    this.player.updateMovement(direction, deltaSeconds);

    // 4. Render hiển thị trực quan các quả bom đang hoạt động
    this.renderBombs();

    // 5. Cập nhật thông số Debug nếu đang bật
    this.updateDebugDisplay();
  }

  private renderBombs(): void {
    this.bombGraphics.clear();
    const bombs = this.bombSystem.getAllBombs();
    if (bombs.length === 0) return;

    for (const bomb of bombs) {
      const worldPos = GridMath.gridToWorld(bomb.coord);
      const pulse = Math.sin(bomb.remainingTime * 10);
      const radius = 16 + pulse * 1.5;

      // Thân quả bom (khối tròn màu sẫm)
      this.bombGraphics.fillStyle(0x0f172a, 1);
      this.bombGraphics.fillCircle(worldPos.x, worldPos.y, radius);

      // Viền phát sáng ngòi nổ (cam / đỏ nhấp nháy)
      this.bombGraphics.lineStyle(2, pulse > 0 ? 0xef4444 : 0xf97316, 1);
      this.bombGraphics.strokeCircle(worldPos.x, worldPos.y, radius);

      // Ngòi nổ tia lửa (Spark)
      this.bombGraphics.fillStyle(0xfacc15, 1);
      this.bombGraphics.fillCircle(worldPos.x + 8, worldPos.y - 12, 3);
    }
  }

  private renderHUD(): void {
    const { WIDTH, HUD_HEIGHT } = GAME_DIMENSIONS;
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x0f172a, 1);
    hudBg.fillRect(0, 0, WIDTH, HUD_HEIGHT);
    hudBg.lineStyle(2, 0x3b82f6, 1);
    hudBg.lineBetween(0, HUD_HEIGHT, WIDTH, HUD_HEIGHT);

    this.add.text(16, 14, 'SCORE: 000000', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#facc15',
      fontStyle: 'bold',
    });

    this.add.text(WIDTH / 2, 14, 'STAGE 3B.2 - BOMB & PASS-THROUGH', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#38bdf8',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(WIDTH - 16, 14, 'LIVES: ♥ ♥ ♥', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(1, 0);
  }

  private renderMap(): void {
    const { GRID_COLS, GRID_ROWS, TILE_SIZE, HUD_HEIGHT } = GAME_DIMENSIONS;
    const graphics = this.add.graphics();

    // Vẽ sàn đấu nền
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = c * TILE_SIZE;
        const y = HUD_HEIGHT + r * TILE_SIZE;

        const isAlternate = (c + r) % 2 === 0;
        graphics.fillStyle(isAlternate ? 0x22c55e : 0x16a34a, 0.9);
        graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }

    // Vẽ các khối Tường cứng và Gạch mềm
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = this.gridSystem.getTile({ col: c, row: r });
        const x = c * TILE_SIZE;
        const y = HUD_HEIGHT + r * TILE_SIZE;

        if (tile === TileType.HARD_WALL) {
          graphics.fillStyle(0x334155, 1);
          graphics.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          graphics.lineStyle(2, 0x64748b, 1);
          graphics.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          graphics.fillStyle(0x475569, 1);
          graphics.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        } else if (tile === TileType.SOFT_BRICK) {
          graphics.fillStyle(0xd97706, 1);
          graphics.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          graphics.lineStyle(2, 0xfbbf24, 0.8);
          graphics.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          graphics.lineStyle(1, 0x92400e, 1);
          graphics.lineBetween(x + 4, y + TILE_SIZE / 2, x + TILE_SIZE - 4, y + TILE_SIZE / 2);
        }
      }
    }
  }

  private setupDebugTools(): void {
    const { WIDTH, HEIGHT } = GAME_DIMENSIONS;
    this.debugGraphics = this.add.graphics().setDepth(100);

    // Phím H để bật/tắt Debug Hitbox
    this.input.keyboard?.on('keydown-H', () => {
      this.isDebugMode = !this.isDebugMode;
      if (!this.isDebugMode) {
        this.debugGraphics.clear();
      }
    });

    // Thông tin hướng dẫn dưới chân màn hình
    this.debugText = this.add.text(
      WIDTH / 2,
      HEIGHT - 20,
      'WASD / Mũi tên: Di chuyển | Space: Đặt bom | Phím H: Debug Hitbox',
      {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#f8fafc',
        backgroundColor: '#0f172acc',
        padding: { x: 8, y: 4 },
      }
    ).setOrigin(0.5).setDepth(101);
  }

  private updateDebugDisplay(): void {
    if (!this.isDebugMode) return;

    this.debugGraphics.clear();
    const aabb = this.player.getHitboxAABB();

    // Vẽ khung Hitbox 28x28 màu đỏ viền vàng
    this.debugGraphics.lineStyle(2, 0xfacc15, 1);
    this.debugGraphics.strokeRect(aabb.left, aabb.top, aabb.width, aabb.height);
    this.debugGraphics.fillStyle(0xef4444, 0.35);
    this.debugGraphics.fillRect(aabb.left, aabb.top, aabb.width, aabb.height);

    // Vẽ tâm nhân vật
    this.debugGraphics.fillStyle(0xffffff, 1);
    this.debugGraphics.fillCircle(aabb.centerX, aabb.centerY, 2);

    // Cập nhật tọa độ hiển thị và thông tin bom
    const grid = GridMath.worldToGrid({ x: this.player.x, y: this.player.y });
    const activeBombs = this.bombSystem.getActiveBombCount(this.player.getId());
    const maxBombs = this.bombSystem.getCapacity(this.player.getId());
    this.debugText.setText(
      `X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)} | Grid: [${grid.col}, ${grid.row}] | Bombs: ${activeBombs}/${maxBombs} | Facing: ${this.player.getFacing()} | Phím H: Tắt Debug`
    );
  }
}
