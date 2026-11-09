import Phaser from 'phaser';
import { Direction, IHitboxAABB, IPlayerState } from '@/types/Player.types';
import { PLAYER_CONFIG, PLAYER_HITBOX_OFFSET } from '@/config/PlayerConfig';
import { PlayerCollisionSystem } from '@/systems/PlayerCollisionSystem';
import { PlayerTextureGenerator } from '@/utils/PlayerTextureGenerator';
import { GridMath } from '@/utils/GridMath';
import { IGridCoord } from '@/types/Grid.types';
import { EventBus } from '@/core/EventBus';
import { GameEvents } from '@/core/GameEvents';
import type { BombSystem } from '@/systems/BombSystem';
import type { IBombData } from '@/types/Bomb.types';

/**
 * Thực thể Người chơi (Player Entity)
 * Kế thừa Phaser.Physics.Arcade.Sprite, nhận PlayerCollisionSystem để di chuyển mượt mà
 * và trượt góc (Corner Sliding).
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly id: string;
  private readonly collisionSystem: PlayerCollisionSystem;
  private bombSystem?: BombSystem;
  private currentDirection: Direction = 'NONE';
  private facingDirection: Direction = 'DOWN';
  private isMovingState: boolean = false;
  private lastGridCoord: IGridCoord;
  private blastPower: number = 1;
  private moveSpeed: number = PLAYER_CONFIG.BASE_SPEED;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    collisionSystem: PlayerCollisionSystem,
    id: string = 'player_1'
  ) {
    // Khởi tạo Sprite với texture mặc định nhìn xuống
    super(scene, x, y, PlayerTextureGenerator.KEYS.DOWN_0);

    this.id = id;
    this.collisionSystem = collisionSystem;
    this.lastGridCoord = GridMath.worldToGrid({ x, y });

    // 1. Thêm vào Scene và hệ thống Arcade Physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 2. Cấu hình Hitbox chuẩn 28x28 pixel căn giữa trên Sprite 48x48 pixel
    this.setupHitbox();

    // 3. Đặt hoạt ảnh ban đầu
    this.play(PlayerTextureGenerator.ANIMS.IDLE_DOWN);
  }

  /**
   * Truy xuất định danh duy nhất của Player
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Thiết lập hệ thống BombSystem liên kết
   */
  public setBombSystem(bombSystem: BombSystem): void {
    this.bombSystem = bombSystem;
  }

  /**
   * Truy xuất BombSystem đang liên kết (nếu có)
   */
  public getBombSystem(): BombSystem | undefined {
    return this.bombSystem;
  }

  public getBlastPower(): number {
    return this.blastPower;
  }

  public setBlastPower(power: number): void {
    this.blastPower = Math.min(6, Math.max(1, power));
  }

  public getMoveSpeed(): number {
    return this.moveSpeed;
  }

  public setMoveSpeed(speed: number): void {
    this.moveSpeed = Math.max(80, speed);
  }

  /**
   * Thực hiện đặt bom tại ô lưới hiện tại theo vị trí tâm Player
   */
  public tryDropBomb(): IBombData | null {
    if (!this.bombSystem) {
      return null;
    }
    const currentGrid = GridMath.worldToGrid({ x: this.x, y: this.y });
    return this.bombSystem.tryPlaceBomb({
      ownerId: this.id,
      coord: currentGrid,
      blastPower: this.blastPower,
    });
  }

  /**
   * Cấu hình chính xác kích thước Hitbox 28x28 và Offset 10px căn giữa
   */
  private setupHitbox(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(PLAYER_CONFIG.HITBOX_WIDTH, PLAYER_CONFIG.HITBOX_HEIGHT);
      body.setOffset(PLAYER_HITBOX_OFFSET.x, PLAYER_HITBOX_OFFSET.y);
      body.setCollideWorldBounds(true);
      // AUD-01 (ADR-012): Vô hiệu hóa Arcade Physics position integration (moves = false).
      // PlayerCollisionSystem chịu trách nhiệm độc quyền điều khiển vị trí (Single Authority).
      // Arcade Body hoạt động như một Kinematic Sensor phục vụ Overlap detection (Stage 3/5).
      body.moves = false;
    }
  }

  /**
   * Cập nhật chuyển động của nhân vật theo thời gian thực (Delta Time)
   */
  public updateMovement(direction: Direction, deltaSeconds: number): void {
    this.currentDirection = direction;

    if (direction !== 'NONE') {
      this.facingDirection = direction;
    }

    // Tính toán vị trí mới qua PlayerCollisionSystem (kèm Corner Sliding và Pass-through check)
    const result = this.collisionSystem.resolveMovement(
      this.x,
      this.y,
      direction,
      deltaSeconds,
      this.id,
      this.moveSpeed
    );

    // Cập nhật vị trí hiển thị và vật lý
    this.setPosition(result.x, result.y);
    this.isMovingState = result.isMoving;

    // Kiểm tra thu hồi quyền đi xuyên bom theo Spatial Disjoint AABB (ADR-013)
    if (this.bombSystem) {
      this.bombSystem.checkEntityDisjoint(this.id, this.getHitboxAABB());
    }

    // Cập nhật hoạt ảnh
    this.updateAnimation();

    // Kiểm tra và phát sự kiện khi đổi ô lưới (chỉ phát khi thực sự đổi ô, không phát mỗi frame)
    const currentGrid = GridMath.worldToGrid({ x: this.x, y: this.y });
    if (
      currentGrid.col !== this.lastGridCoord.col ||
      currentGrid.row !== this.lastGridCoord.row
    ) {
      this.lastGridCoord = currentGrid;
      EventBus.emit(GameEvents.PLAYER_MOVED, {
        col: currentGrid.col,
        row: currentGrid.row,
        x: this.x,
        y: this.y,
      });
    }
  }

  /**
   * Cập nhật hoạt ảnh tương ứng theo hướng di chuyển và trạng thái dừng
   */
  private updateAnimation(): void {
    const anims = PlayerTextureGenerator.ANIMS;

    if (this.isMovingState) {
      if (this.facingDirection === 'DOWN') this.play(anims.WALK_DOWN, true);
      else if (this.facingDirection === 'UP') this.play(anims.WALK_UP, true);
      else if (this.facingDirection === 'LEFT') this.play(anims.WALK_LEFT, true);
      else if (this.facingDirection === 'RIGHT') this.play(anims.WALK_RIGHT, true);
    } else {
      if (this.facingDirection === 'DOWN') this.play(anims.IDLE_DOWN, true);
      else if (this.facingDirection === 'UP') this.play(anims.IDLE_UP, true);
      else if (this.facingDirection === 'LEFT') this.play(anims.IDLE_LEFT, true);
      else if (this.facingDirection === 'RIGHT') this.play(anims.IDLE_RIGHT, true);
    }
  }

  public getDirection(): Direction {
    return this.currentDirection;
  }

  public getFacing(): Direction {
    return this.facingDirection;
  }

  public isMoving(): boolean {
    return this.isMovingState;
  }

  public getHitboxAABB(): IHitboxAABB {
    return this.collisionSystem.getHitboxAABB(this.x, this.y);
  }

  public getState(): IPlayerState {
    return {
      position: { x: this.x, y: this.y },
      velocity: {
        x: this.body ? this.body.velocity.x : 0,
        y: this.body ? this.body.velocity.y : 0,
      },
      direction: this.currentDirection,
      facing: this.facingDirection,
      isMoving: this.isMovingState,
    };
  }
}
