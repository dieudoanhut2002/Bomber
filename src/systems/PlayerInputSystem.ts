import type Phaser from 'phaser';
import { Direction } from '@/types/Player.types';

export interface IInputSource {
  getDirection(): Direction;
  cleanup(): void;
}

/**
 * Trình xử lý logic giải quyết xung đột đa phím (Orthogonal Input Resolver)
 * Thuần túy TypeScript, độc lập với Phaser, hỗ trợ kiểm thử Headless 100%.
 */
export class OrthogonalInputResolver {
  // Ngăn xếp lưu thứ tự các hướng đang được nhấn giữ (Last-In-First-Out)
  private readonly activeDirections: Direction[] = [];

  /**
   * Cập nhật trạng thái nhấn / thả của một hướng
   */
  public setDirectionState(direction: Direction, isDown: boolean): void {
    if (direction === 'NONE') return;

    const index = this.activeDirections.indexOf(direction);

    if (isDown) {
      if (index === -1) {
        // Thêm vào đỉnh ngăn xếp: Hướng mới nhấn sẽ có độ ưu tiên cao nhất
        this.activeDirections.push(direction);
      }
    } else {
      if (index !== -1) {
        // Loại bỏ khỏi ngăn xếp khi phím được thả ra
        this.activeDirections.splice(index, 1);
      }
    }
  }

  /**
   * Lấy hướng ưu tiên hiện tại (hướng ở đỉnh ngăn xếp)
   */
  public getDirection(): Direction {
    if (this.activeDirections.length === 0) {
      return 'NONE';
    }
    return this.activeDirections[this.activeDirections.length - 1];
  }

  /**
   * Xóa toàn bộ trạng thái input
   */
  public reset(): void {
    this.activeDirections.length = 0;
  }
}

/**
 * Hệ thống Quản lý Input cho Player (PlayerInputSystem)
 * Đọc phím Arrow Keys và WASD từ Phaser Keyboard, tự động cleanup theo Scene lifecycle.
 */
export class PlayerInputSystem implements IInputSource {
  private readonly resolver: OrthogonalInputResolver;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private keyW: Phaser.Input.Keyboard.Key | null = null;
  private keyA: Phaser.Input.Keyboard.Key | null = null;
  private keyS: Phaser.Input.Keyboard.Key | null = null;
  private keyD: Phaser.Input.Keyboard.Key | null = null;
  private keySpace: Phaser.Input.Keyboard.Key | null = null;
  private isSpaceDownPrevious: boolean = false;
  private headlessSpaceDown: boolean = false;
  private isCleanedUp: boolean = false;

  constructor(scene?: Phaser.Scene) {
    this.resolver = new OrthogonalInputResolver();

    if (scene && scene.input && scene.input.keyboard) {
      this.initKeyboard(scene);
    }
  }

  private initKeyboard(scene: Phaser.Scene): void {
    const keyboard = scene.input.keyboard;
    if (!keyboard) return;

    this.cursors = keyboard.createCursorKeys();
    this.keyW = keyboard.addKey(87); // W
    this.keyA = keyboard.addKey(65); // A
    this.keyS = keyboard.addKey(83); // S
    this.keyD = keyboard.addKey(68); // D
    this.keySpace = keyboard.addKey(32); // Spacebar

    // Tự động dọn dẹp khi Scene shutdown hoặc destroy
    scene.events.once('shutdown', () => this.cleanup());
    scene.events.once('destroy', () => this.cleanup());
  }

  /**
   * Đọc trạng thái bàn phím thời gian thực và trả về hướng di chuyển đã giải quyết
   */
  public getDirection(): Direction {
    if (this.isCleanedUp) return 'NONE';

    // Cập nhật trạng thái từng hướng nếu các phím bàn phím đã được khởi tạo
    if (this.cursors || this.keyW) {
      const isUp = Boolean(this.cursors?.up?.isDown || this.keyW?.isDown);
      const isDown = Boolean(this.cursors?.down?.isDown || this.keyS?.isDown);
      const isLeft = Boolean(this.cursors?.left?.isDown || this.keyA?.isDown);
      const isRight = Boolean(this.cursors?.right?.isDown || this.keyD?.isDown);

      this.resolver.setDirectionState('UP', isUp);
      this.resolver.setDirectionState('DOWN', isDown);
      this.resolver.setDirectionState('LEFT', isLeft);
      this.resolver.setDirectionState('RIGHT', isRight);
    }

    return this.resolver.getDirection();
  }

  /**
   * Kiểm tra xem phím đặt bom (Spacebar) có vừa được nhấn trong frame này hay không (Single-shot)
   * Nhấn giữ sẽ không kích hoạt đặt bom liên tục; chỉ kích hoạt lại sau khi nhả và nhấn lại.
   */
  public isBombJustPressed(): boolean {
    if (this.isCleanedUp) return false;

    const isDown = Boolean(
      this.keySpace?.isDown ||
      this.cursors?.space?.isDown ||
      this.headlessSpaceDown
    );

    const justPressed = isDown && !this.isSpaceDownPrevious;
    this.isSpaceDownPrevious = isDown;
    return justPressed;
  }

  /**
   * Thiết lập trạng thái phím Space giả lập (phục vụ kiểm thử Headless trong Vitest)
   */
  public setSpaceState(isDown: boolean): void {
    this.headlessSpaceDown = isDown;
  }

  /**
   * Truy xuất đối tượng Resolver bên trong (phục vụ Unit Testing)
   */
  public getResolver(): OrthogonalInputResolver {
    return this.resolver;
  }

  /**
   * Dọn dẹp tài nguyên bàn phím, ngăn ngừa rò rỉ bộ nhớ
   */
  public cleanup(): void {
    this.isCleanedUp = true;
    this.resolver.reset();
    this.cursors = null;
    this.keyW = null;
    this.keyA = null;
    this.keyS = null;
    this.keyD = null;
    this.keySpace = null;
    this.isSpaceDownPrevious = false;
    this.headlessSpaceDown = false;
  }
}
