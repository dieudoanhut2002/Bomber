import Phaser from 'phaser';
import { SceneKey } from '@/types/Game.types';
import { TileType, IGridCoord } from '@/types/Grid.types';
import { GAME_DIMENSIONS } from '@/config/GridConfig';
import { BOMB_CONFIG } from '@/config/BombConfig';
import { GridMath } from '@/utils/GridMath';
import { MapGenerator } from '@/systems/MapGenerator';
import { GridSystem } from '@/systems/GridSystem';
import { BombSystem } from '@/systems/BombSystem';
import { ExplosionRaycaster } from '@/systems/ExplosionRaycaster';
import { ExplosionSystem } from '@/systems/ExplosionSystem';
import { PlayerCollisionSystem } from '@/systems/PlayerCollisionSystem';
import { PlayerInputSystem } from '@/systems/PlayerInputSystem';
import { ItemSystem } from '@/systems/ItemSystem';
import { EnemySystem } from '@/systems/EnemySystem';
import { ScoreSystem } from '@/systems/ScoreSystem';
import { PlayerTextureGenerator } from '@/utils/PlayerTextureGenerator';
import { Player } from '@/entities/Player';
import { EventBus } from '@/core/EventBus';
import { GameEvents } from '@/core/GameEvents';
import { SoundEffects } from '@/utils/SoundEffects';

/**
 * GameScene: Màn hình chính điều phối toàn bộ vòng lặp Gameplay (Playable)
 * Tích hợp Bản đồ, Bom, Nổ dây chuyền BFS, Vật phẩm, Quái vật AI, Âm thanh Retro và HUD.
 */
export class GameScene extends Phaser.Scene {
  private gridSystem!: GridSystem;
  private bombSystem!: BombSystem;
  private explosionSystem!: ExplosionSystem;
  private collisionSystem!: PlayerCollisionSystem;
  private inputSystem!: PlayerInputSystem;
  private itemSystem!: ItemSystem;
  private enemySystem!: EnemySystem;
  private scoreSystem!: ScoreSystem;
  private player!: Player;

  // Trạng thái vòng chơi
  private isGameOver: boolean = false;
  private isGameWon: boolean = false;
  private playerInvulnerableTimer: number = 0;

  // Graphics Layers
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private brickGraphics!: Phaser.GameObjects.Graphics;
  private itemGraphics!: Phaser.GameObjects.Graphics;
  private bombGraphics!: Phaser.GameObjects.Graphics;
  private explosionGraphics!: Phaser.GameObjects.Graphics;
  private enemyGraphics!: Phaser.GameObjects.Graphics;
  private overlayGraphics!: Phaser.GameObjects.Graphics;

  // HUD Texts
  private hudScoreText!: Phaser.GameObjects.Text;
  private hudTimeText!: Phaser.GameObjects.Text;
  private hudLivesText!: Phaser.GameObjects.Text;
  private hudStageText!: Phaser.GameObjects.Text;
  private statusModalText!: Phaser.GameObjects.Text;

  // Debug Hitbox
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private isDebugMode: boolean = false;

  constructor() {
    super({ key: SceneKey.GAME });
  }

  public create(): void {
    this.isGameOver = false;
    this.isGameWon = false;
    this.playerInvulnerableTimer = 0;

    // 1. Sinh texture cho Player
    PlayerTextureGenerator.generate(this);

    // 2. Khởi tạo ScoreSystem
    this.scoreSystem = new ScoreSystem();

    // 3. Khởi tạo Bản đồ & GridSystem
    const gameMap = MapGenerator.generate({
      stage: this.scoreSystem.getStage(),
      seed: Date.now(),
    });
    this.gridSystem = new GridSystem(gameMap);

    // 4. Khởi tạo BombSystem & ExplosionSystem
    this.bombSystem = new BombSystem(this.gridSystem);
    const raycaster = new ExplosionRaycaster(this.gridSystem, this.bombSystem);
    this.explosionSystem = new ExplosionSystem(this.gridSystem, this.bombSystem, raycaster);

    // 5. Khởi tạo Hệ thống va chạm, Input, Vật phẩm & Quái vật
    this.collisionSystem = new PlayerCollisionSystem(this.gridSystem, this.bombSystem);
    this.inputSystem = new PlayerInputSystem(this);
    this.itemSystem = new ItemSystem(this.gridSystem);
    this.enemySystem = new EnemySystem(this.gridSystem, this.bombSystem);

    // 6. Tạo các Layer đồ họa theo đúng độ sâu (Depth)
    this.bgGraphics = this.add.graphics().setDepth(1);
    this.brickGraphics = this.add.graphics().setDepth(2);
    this.itemGraphics = this.add.graphics().setDepth(3);
    this.bombGraphics = this.add.graphics().setDepth(4);
    this.explosionGraphics = this.add.graphics().setDepth(5);
    this.enemyGraphics = this.add.graphics().setDepth(8);
    this.overlayGraphics = this.add.graphics().setDepth(50);
    this.debugGraphics = this.add.graphics().setDepth(100);

    // 7. Khởi tạo Player tại vị trí Spawn
    const spawnCoord = this.gridSystem.getPlayerSpawn();
    const spawnWorld = GridMath.gridToWorld(spawnCoord);
    this.player = new Player(this, spawnWorld.x, spawnWorld.y, this.collisionSystem);
    this.player.setBombSystem(this.bombSystem);
    this.player.setDepth(10);
    this.bombSystem.registerOwner(this.player.getId(), BOMB_CONFIG.DEFAULT_BOMB_CAPACITY);

    // 8. Sinh Quái vật trên bản đồ
    this.enemySystem.spawnEnemiesForStage(this.scoreSystem.getStage());

    // 9. Vẽ Bản đồ tĩnh & Gạch
    this.renderBackgroundMap();
    this.renderBricksAndDoors();
    this.setupHUD();

    // 10. Đăng ký các sự kiện EventBus
    this.setupEventHandlers();

    // 11. Bàn phím điều khiển khởi động lại (R) và Debug (H)
    this.input.keyboard?.on('keydown-R', () => this.restartGame());
    this.input.keyboard?.on('keydown-H', () => {
      this.isDebugMode = !this.isDebugMode;
      if (!this.isDebugMode) this.debugGraphics.clear();
    });

    // Cleanup khi Scene shutdown
    this.events.once('shutdown', () => this.cleanupSystems());
    this.events.once('destroy', () => this.cleanupSystems());
  }

  public override update(_time: number, delta: number): void {
    const deltaSeconds = Math.min(Math.max(0, delta / 1000), 0.1);

    // Nếu game đã kết thúc (Thắng hoặc Thua), kiểm tra phím bấm để chơi lại
    if (this.isGameOver || this.isGameWon) {
      if (this.inputSystem.isBombJustPressed()) {
        this.restartGame();
      }
      return;
    }

    // 1. Cập nhật đồng hồ đếm ngược
    const timeOut = this.scoreSystem.updateTimer(deltaSeconds);
    if (timeOut) {
      this.triggerGameOver('HẾT THỜI GIAN!');
      return;
    }

    // 2. Xử lý Input đặt bom (Spacebar)
    if (this.inputSystem.isBombJustPressed()) {
      const placed = this.player.tryDropBomb();
      if (placed) {
        SoundEffects.playBombDrop();
      }
    }

    // 3. Cập nhật Fuse Bom và kích nổ mẻ vụ nổ
    const explodingBombs = this.bombSystem.update(deltaSeconds);
    if (explodingBombs.length > 0) {
      this.explosionSystem.processExplosionBatch(explodingBombs);
      SoundEffects.playExplosion();
    }

    // 4. Cập nhật đếm ngược thời lượng vụ nổ
    this.explosionSystem.update(deltaSeconds);

    // 5. Cập nhật di chuyển cho Player
    const direction = this.inputSystem.getDirection();
    this.player.updateMovement(direction, deltaSeconds);

    // 6. Cập nhật Vật phẩm (nhặt item, thiêu rụi)
    this.itemSystem.update(deltaSeconds, this.explosionSystem, this.player, this.bombSystem);

    // 7. Cập nhật Quái vật AI và kiểm tra va chạm với người chơi
    const playerHitByEnemy = this.enemySystem.update(
      deltaSeconds,
      this.explosionSystem,
      this.player
    );

    // 8. Kiểm tra sát thương cho Người chơi (Tia lửa nổ hoặc Quái vật)
    const playerGrid = GridMath.worldToGrid({ x: this.player.x, y: this.player.y });
    const inBlastFlame = this.explosionSystem.isDamageActiveAt(playerGrid);

    if ((inBlastFlame || playerHitByEnemy) && this.playerInvulnerableTimer <= 0) {
      this.handlePlayerDamage();
    }

    // Cập nhật hiệu ứng chớp nháy bất tử của Player
    if (this.playerInvulnerableTimer > 0) {
      this.playerInvulnerableTimer -= deltaSeconds;
      this.player.setAlpha(Math.sin(this.playerInvulnerableTimer * 28) > 0 ? 0.35 : 1.0);
    } else {
      this.player.setAlpha(1.0);
    }

    // 9. Kiểm tra điều kiện Qua Màn (Bước vào Cửa thoát hiểm khi đã sạch quái)
    this.checkExitDoorEntry(playerGrid);

    // 10. Render các thành phần đồ họa động
    this.renderBombs();
    this.renderExplosions();
    this.renderItems();
    this.renderEnemies();
    this.updateHUDText();

    if (this.isDebugMode) {
      this.renderDebug();
    }
  }

  private handlePlayerDamage(): void {
    this.playerInvulnerableTimer = 2.0; // 2.0s i-frames
    SoundEffects.playPlayerHit();
    const remainingLives = this.scoreSystem.loseLife();

    if (remainingLives <= 0) {
      this.triggerGameOver('BẠN ĐÃ HẾT MẠNG!');
    }
  }

  private checkExitDoorEntry(playerGrid: IGridCoord): void {
    const exitCoord = this.gridSystem.getMap().getExitCoord();
    if (playerGrid.col === exitCoord.col && playerGrid.row === exitCoord.row) {
      const tile = this.gridSystem.getTile(exitCoord);
      // Cửa đã lộ diện và toàn bộ quái vật đã bị tiêu diệt
      if (tile === TileType.EXIT_DOOR_OPEN || this.enemySystem.getAliveCount() === 0) {
        this.triggerVictory();
      }
    }
  }

  private triggerGameOver(reason: string): void {
    this.isGameOver = true;
    this.overlayGraphics.clear();
    const { WIDTH, HEIGHT } = GAME_DIMENSIONS;

    this.overlayGraphics.fillStyle(0x000000, 0.75);
    this.overlayGraphics.fillRect(0, 0, WIDTH, HEIGHT);

    this.statusModalText.setText(`GAME OVER\n${reason}\n\nNhấn 'R' hoặc 'Space' để chơi lại`)
      .setColor('#ef4444')
      .setVisible(true);
  }

  private triggerVictory(): void {
    this.isGameWon = true;
    SoundEffects.playVictory();
    const bonus = this.scoreSystem.calculateTimeBonus();

    this.overlayGraphics.clear();
    const { WIDTH, HEIGHT } = GAME_DIMENSIONS;

    this.overlayGraphics.fillStyle(0x000000, 0.75);
    this.overlayGraphics.fillRect(0, 0, WIDTH, HEIGHT);

    this.statusModalText.setText(
      `STAGE CLEARED!\nĐiểm thưởng thời gian: +${bonus}\nTổng điểm: ${this.scoreSystem.getScore()}\n\nNhấn 'R' hoặc 'Space' để chơi ván mới`
    )
      .setColor('#22c55e')
      .setVisible(true);
  }

  private restartGame(): void {
    this.statusModalText.setVisible(false);
    this.overlayGraphics.clear();
    this.scene.restart();
  }

  private setupEventHandlers(): void {
    EventBus.on(GameEvents.BLOCK_DESTROYED, (payload) => {
      this.itemSystem.onBrickDestroyed({ col: payload.col, row: payload.row });
      this.scoreSystem.addScore(50);
      this.renderBricksAndDoors();
    });

    EventBus.on(GameEvents.ENEMY_KILLED, (payload) => {
      this.scoreSystem.addScore(payload.score);
    });

    EventBus.on(GameEvents.ALL_ENEMIES_DEFEATED, () => {
      this.renderBricksAndDoors(); // Cập nhật hình ảnh Cửa thoát hiểm mở
    });
  }

  private renderBackgroundMap(): void {
    const { GRID_COLS, GRID_ROWS, TILE_SIZE, HUD_HEIGHT } = GAME_DIMENSIONS;
    this.bgGraphics.clear();

    // 1. Sàn đấu ca-rô xanh lá
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = c * TILE_SIZE;
        const y = HUD_HEIGHT + r * TILE_SIZE;
        const isAlternate = (c + r) % 2 === 0;
        this.bgGraphics.fillStyle(isAlternate ? 0x22c55e : 0x16a34a, 1);
        this.bgGraphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }

    // 2. Tường cứng cố định (Trụ cột và Tường bao quanh)
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.gridSystem.getTile({ col: c, row: r }) === TileType.HARD_WALL) {
          const x = c * TILE_SIZE;
          const y = HUD_HEIGHT + r * TILE_SIZE;

          this.bgGraphics.fillStyle(0x334155, 1);
          this.bgGraphics.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          this.bgGraphics.lineStyle(2, 0x64748b, 1);
          this.bgGraphics.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          this.bgGraphics.fillStyle(0x475569, 1);
          this.bgGraphics.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        }
      }
    }
  }

  private renderBricksAndDoors(): void {
    const { GRID_COLS, GRID_ROWS, TILE_SIZE, HUD_HEIGHT } = GAME_DIMENSIONS;
    this.brickGraphics.clear();

    const exitCoord = this.gridSystem.getMap().getExitCoord();

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = this.gridSystem.getTile({ col: c, row: r });
        const x = c * TILE_SIZE;
        const y = HUD_HEIGHT + r * TILE_SIZE;

        if (tile === TileType.SOFT_BRICK) {
          // Khối gạch mềm màu nâu cam
          this.brickGraphics.fillStyle(0xd97706, 1);
          this.brickGraphics.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          this.brickGraphics.lineStyle(2, 0xfbbf24, 0.9);
          this.brickGraphics.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          this.brickGraphics.lineStyle(1, 0x92400e, 1);
          this.brickGraphics.lineBetween(x + 4, y + TILE_SIZE / 2, x + TILE_SIZE - 4, y + TILE_SIZE / 2);
        } else if (
          (tile === TileType.EXIT_DOOR_LOCKED || tile === TileType.EXIT_DOOR_OPEN) ||
          (c === exitCoord.col && r === exitCoord.row && tile === TileType.EMPTY && this.gridSystem.isDestructible(exitCoord) === false)
        ) {
          // Vẽ Cửa thoát hiểm lộ diện
          const isDoorOpen = this.enemySystem ? this.enemySystem.getAliveCount() === 0 : false;
          this.brickGraphics.fillStyle(isDoorOpen ? 0x065f46 : 0x7f1d1d, 1);
          this.brickGraphics.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          this.brickGraphics.lineStyle(2, isDoorOpen ? 0x34d399 : 0xf87171, 1);
          this.brickGraphics.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);

          // Biểu tượng cánh cửa
          this.brickGraphics.fillStyle(isDoorOpen ? 0x6ee7b7 : 0xfca5a5, 1);
          this.brickGraphics.fillRect(x + 12, y + 10, TILE_SIZE - 24, TILE_SIZE - 20);
        }
      }
    }
  }

  private renderBombs(): void {
    this.bombGraphics.clear();
    const bombs = this.bombSystem.getAllBombs();
    if (bombs.length === 0) return;

    for (const bomb of bombs) {
      const worldPos = GridMath.gridToWorld(bomb.coord);
      const pulse = Math.sin(bomb.remainingTime * 12);
      const radius = 17 + pulse * 1.5;

      this.bombGraphics.fillStyle(0x0f172a, 1);
      this.bombGraphics.fillCircle(worldPos.x, worldPos.y, radius);

      this.bombGraphics.lineStyle(2, pulse > 0 ? 0xef4444 : 0xf97316, 1);
      this.bombGraphics.strokeCircle(worldPos.x, worldPos.y, radius);

      this.bombGraphics.fillStyle(0xfacc15, 1);
      this.bombGraphics.fillCircle(worldPos.x + 8, worldPos.y - 12, 3.5);
    }
  }

  private renderExplosions(): void {
    this.explosionGraphics.clear();
    const explosions = this.explosionSystem.getActiveExplosions();
    if (explosions.length === 0) return;

    const { TILE_SIZE } = GAME_DIMENSIONS;

    for (const exp of explosions) {
      for (const segment of exp.segments) {
        const worldPos = GridMath.gridToWorld(segment.coord);
        const halfTile = TILE_SIZE / 2;

        // Tâm lửa: hình cầu lửa rực sáng
        if (segment.direction === 'CENTER') {
          this.explosionGraphics.fillStyle(0xf97316, 0.85);
          this.explosionGraphics.fillRect(worldPos.x - halfTile + 4, worldPos.y - halfTile + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          this.explosionGraphics.fillStyle(0xfef08a, 1);
          this.explosionGraphics.fillCircle(worldPos.x, worldPos.y, 14);
        } else {
          // Thân và Tip của tia nổ
          this.explosionGraphics.fillStyle(0xea580c, 0.8);
          this.explosionGraphics.fillRect(worldPos.x - halfTile + 6, worldPos.y - halfTile + 6, TILE_SIZE - 12, TILE_SIZE - 12);
          this.explosionGraphics.fillStyle(0xfacc15, 0.9);
          this.explosionGraphics.fillCircle(worldPos.x, worldPos.y, 10);
        }
      }
    }
  }

  private renderItems(): void {
    this.itemGraphics.clear();
    const items = this.itemSystem.getItems();
    if (items.length === 0) return;

    for (const item of items) {
      const worldPos = GridMath.gridToWorld(item.coord);

      let color = 0x3b82f6; // Bomb Up (Xanh dương)
      if (item.type === 'FIRE_UP') color = 0xef4444; // Fire Up (Đỏ)
      if (item.type === 'SPEED_UP') color = 0xeab308; // Speed Up (Vàng)

      // Vòng tròn vật phẩm
      this.itemGraphics.fillStyle(color, 1);
      this.itemGraphics.fillCircle(worldPos.x, worldPos.y, 14);
      this.itemGraphics.lineStyle(2, 0xffffff, 0.9);
      this.itemGraphics.strokeCircle(worldPos.x, worldPos.y, 14);

      // Điểm sáng ở giữa
      this.itemGraphics.fillStyle(0xffffff, 0.8);
      this.itemGraphics.fillCircle(worldPos.x - 4, worldPos.y - 4, 3);
    }
  }

  private renderEnemies(): void {
    this.enemyGraphics.clear();
    const enemies = this.enemySystem.getEnemies();
    if (enemies.length === 0) return;

    for (const enemy of enemies) {
      if (!enemy.isAlive) continue;

      if (enemy.type === 'BALLOM') {
        // Quái Ballom: Hình cầu màu cam tròn xoe, có mắt
        this.enemyGraphics.fillStyle(0xf97316, 1);
        this.enemyGraphics.fillCircle(enemy.x, enemy.y, 15);
        this.enemyGraphics.lineStyle(2, 0xc2410c, 1);
        this.enemyGraphics.strokeCircle(enemy.x, enemy.y, 15);

        // Mắt quái
        this.enemyGraphics.fillStyle(0xffffff, 1);
        this.enemyGraphics.fillCircle(enemy.x - 5, enemy.y - 3, 3.5);
        this.enemyGraphics.fillCircle(enemy.x + 5, enemy.y - 3, 3.5);
        this.enemyGraphics.fillStyle(0x000000, 1);
        this.enemyGraphics.fillCircle(enemy.x - 5, enemy.y - 3, 1.8);
        this.enemyGraphics.fillCircle(enemy.x + 5, enemy.y - 3, 1.8);
      } else if (enemy.type === 'ONEAL') {
        // Quái Oneal: Màu xanh lam đậm, có tai/sừng
        this.enemyGraphics.fillStyle(0x2563eb, 1);
        this.enemyGraphics.fillCircle(enemy.x, enemy.y, 15);
        this.enemyGraphics.lineStyle(2, 0x1d4ed8, 1);
        this.enemyGraphics.strokeCircle(enemy.x, enemy.y, 15);

        // Mắt đỏ dữ tợn
        this.enemyGraphics.fillStyle(0xef4444, 1);
        this.enemyGraphics.fillCircle(enemy.x - 5, enemy.y - 3, 3.5);
        this.enemyGraphics.fillCircle(enemy.x + 5, enemy.y - 3, 3.5);
        this.enemyGraphics.fillStyle(0xffffff, 1);
        this.enemyGraphics.fillCircle(enemy.x - 5, enemy.y - 3, 1.5);
        this.enemyGraphics.fillCircle(enemy.x + 5, enemy.y - 3, 1.5);
      }
    }
  }

  private setupHUD(): void {
    const { WIDTH, HUD_HEIGHT } = GAME_DIMENSIONS;

    const hudBg = this.add.graphics().setDepth(20);
    hudBg.fillStyle(0x0f172a, 1);
    hudBg.fillRect(0, 0, WIDTH, HUD_HEIGHT);
    hudBg.lineStyle(2, 0x3b82f6, 1);
    hudBg.lineBetween(0, HUD_HEIGHT, WIDTH, HUD_HEIGHT);

    this.hudScoreText = this.add.text(16, 14, 'SCORE: 000000', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setDepth(21);

    this.hudTimeText = this.add.text(WIDTH / 2 - 80, 14, 'TIME: 200', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#38bdf8',
      fontStyle: 'bold',
    }).setDepth(21);

    this.hudStageText = this.add.text(WIDTH / 2 + 50, 14, 'STAGE: 1', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#a855f7',
      fontStyle: 'bold',
    }).setDepth(21);

    this.hudLivesText = this.add.text(WIDTH - 16, 14, 'LIVES: ♥ ♥ ♥', {
      fontFamily: 'Courier, monospace',
      fontSize: '18px',
      color: '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(21);

    // Modal Text thông báo Game Over / Victory
    this.statusModalText = this.add.text(WIDTH / 2, GAME_DIMENSIONS.HEIGHT / 2, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '26px',
      align: 'center',
      fontStyle: 'bold',
      lineSpacing: 10,
    }).setOrigin(0.5).setDepth(60).setVisible(false);
  }

  private updateHUDText(): void {
    const scoreStr = this.scoreSystem.getScore().toString().padStart(6, '0');
    this.hudScoreText.setText(`SCORE: ${scoreStr}`);
    this.hudTimeText.setText(`TIME: ${Math.ceil(this.scoreSystem.getRemainingTime())}`);
    this.hudStageText.setText(`STAGE: ${this.scoreSystem.getStage()}`);

    const lives = this.scoreSystem.getLives();
    const hearts = '♥ '.repeat(lives).trim();
    this.hudLivesText.setText(`LIVES: ${hearts || 'CHẾT'}`);
  }

  private renderDebug(): void {
    this.debugGraphics.clear();
    const aabb = this.player.getHitboxAABB();
    this.debugGraphics.lineStyle(2, 0xfacc15, 1);
    this.debugGraphics.strokeRect(aabb.left, aabb.top, aabb.width, aabb.height);
  }

  private cleanupSystems(): void {
    EventBus.removeAllListeners();
    this.bombSystem.cleanup();
    this.explosionSystem.cleanup();
    this.itemSystem.cleanup();
    this.enemySystem.cleanup();
  }
}
