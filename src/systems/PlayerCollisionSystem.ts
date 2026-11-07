import { IGridCoord, IWorldPosition, TileType } from '@/types/Grid.types';
import { Direction, IHitboxAABB } from '@/types/Player.types';
import { PLAYER_CONFIG } from '@/config/PlayerConfig';
import { GAME_DIMENSIONS } from '@/config/GridConfig';
import { GridSystem } from '@/systems/GridSystem';
import type { BombSystem } from '@/systems/BombSystem';

export interface IMovementResult {
  x: number;
  y: number;
  isMoving: boolean;
  didSlide: boolean;
}

/**
 * Hệ thống Va chạm & Xử lý Trượt góc (Player Collision & Corner Sliding System)
 * Hoàn toàn độc lập với Phaser, hỗ trợ kiểm thử tự động 100% bằng Vitest.
 */
export class PlayerCollisionSystem {
  private readonly gridSystem: GridSystem;
  private bombSystem?: BombSystem;
  private readonly hitboxHalfWidth: number;
  private readonly hitboxHalfHeight: number;

  constructor(gridSystem: GridSystem, bombSystem?: BombSystem) {
    this.gridSystem = gridSystem;
    this.bombSystem = bombSystem;
    this.hitboxHalfWidth = PLAYER_CONFIG.HITBOX_WIDTH / 2;   // 14px
    this.hitboxHalfHeight = PLAYER_CONFIG.HITBOX_HEIGHT / 2; // 14px
  }

  /**
   * Thiết lập hoặc cập nhật BombSystem liên kết
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

  /**
   * Tính toán hộp AABB (Axis-Aligned Bounding Box) cho Hitbox 28x28 tại tâm (x, y)
   */
  public getHitboxAABB(x: number, y: number): IHitboxAABB {
    return {
      left: x - this.hitboxHalfWidth,
      right: x + this.hitboxHalfWidth,
      top: y - this.hitboxHalfHeight,
      bottom: y + this.hitboxHalfHeight,
      width: PLAYER_CONFIG.HITBOX_WIDTH,
      height: PLAYER_CONFIG.HITBOX_HEIGHT,
      centerX: x,
      centerY: y,
    };
  }

  /**
   * Kiểm tra xem một ô lưới có thể đi qua đối với một Player cụ thể hay không
   * Nếu ô là Bomb và Player có quyền đi xuyên (Spatial Disjoint Pass-through), ô được coi là Walkable.
   */
  public isWalkableAt(coord: IGridCoord, playerId?: string): boolean {
    const tile = this.gridSystem.getTile(coord);
    if (tile === null) return false;

    if (tile === TileType.BOMB && this.bombSystem && playerId) {
      const bomb = this.bombSystem.getBombAt(coord);
      if (bomb && this.bombSystem.canEntityPassThrough(playerId, bomb.id)) {
        return true;
      }
    }

    return this.gridSystem.isWalkable(coord);
  }

  /**
   * Kiểm tra vị trí (x, y) có gây va chạm với tường/gạch hoặc vượt biên hay không
   */
  public isColliding(x: number, y: number, playerId?: string): boolean {
    const aabb = this.getHitboxAABB(x, y);

    // 1. Kiểm tra biên giới hạn của khung sàn đấu (World Bounds)
    if (
      aabb.left < 0 ||
      aabb.right > GAME_DIMENSIONS.WIDTH ||
      aabb.top < GAME_DIMENSIONS.HUD_HEIGHT ||
      aabb.bottom > GAME_DIMENSIONS.HEIGHT
    ) {
      return true;
    }

    // 2. Chuyển đổi các cạnh AABB sang phạm vi ô lưới cần kiểm tra
    const minCol = Math.floor(aabb.left / GAME_DIMENSIONS.TILE_SIZE);
    const maxCol = Math.floor((aabb.right - 0.001) / GAME_DIMENSIONS.TILE_SIZE);
    const minRow = Math.floor((aabb.top - GAME_DIMENSIONS.HUD_HEIGHT) / GAME_DIMENSIONS.TILE_SIZE);
    const maxRow = Math.floor(((aabb.bottom - 0.001) - GAME_DIMENSIONS.HUD_HEIGHT) / GAME_DIMENSIONS.TILE_SIZE);

    // 3. Quét mọi ô lưới nằm trong phạm vi AABB
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (!this.isWalkableAt({ col: c, row: r }, playerId)) {
          return true; // Chạm vào vật cản không thể đi qua (Hard Wall, Soft Brick, Bomb không có quyền)
        }
      }
    }

    return false;
  }

  /**
   * Tính toán và giải quyết va chạm cho di chuyển, tích hợp thuật toán Trượt góc (Corner Sliding)
   * Sử dụng kỹ thuật Sub-stepping để ngăn chặn hoàn toàn hiện tượng xuyên thấu (Tunneling) khi di chuyển nhanh.
   */
  public resolveMovement(
    currentX: number,
    currentY: number,
    direction: Direction,
    deltaSeconds: number,
    playerId?: string
  ): IMovementResult {
    if (direction === 'NONE' || deltaSeconds <= 0) {
      return { x: currentX, y: currentY, isMoving: false, didSlide: false };
    }

    // AUD-04: Giới hạn deltaSeconds tối đa 0.1s (100ms) để ngăn chặn lag spike và giới hạn sub-stepping
    const clampedDelta = Math.min(Math.max(0, deltaSeconds), 0.1);
    const totalDistance = PLAYER_CONFIG.BASE_SPEED * clampedDelta;
    const maxStepSize = 4; // Bước kiểm tra tối đa 4px
    const steps = Math.max(1, Math.ceil(totalDistance / maxStepSize));
    const stepDistance = totalDistance / steps;

    let posX = currentX;
    let posY = currentY;
    let movedAny = false;
    let slidAny = false;

    for (let s = 0; s < steps; s++) {
      const stepResult = this.resolveSingleStep(posX, posY, direction, stepDistance, playerId);
      posX = stepResult.x;
      posY = stepResult.y;
      if (stepResult.isMoving) movedAny = true;
      if (stepResult.didSlide) slidAny = true;

      // Nếu bước này bị chặn đứng hoàn toàn, dừng các bước tiếp theo
      if (!stepResult.isMoving) {
        break;
      }
    }

    return { x: posX, y: posY, isMoving: movedAny, didSlide: slidAny };
  }

  /**
   * Giải quyết di chuyển cho một bước nhỏ (Single Step)
   */
  private resolveSingleStep(
    currentX: number,
    currentY: number,
    direction: Direction,
    moveDistance: number,
    playerId?: string
  ): IMovementResult {
    let dx = 0;
    let dy = 0;
    if (direction === 'UP') dy = -moveDistance;
    else if (direction === 'DOWN') dy = moveDistance;
    else if (direction === 'LEFT') dx = -moveDistance;
    else if (direction === 'RIGHT') dx = moveDistance;

    const targetX = currentX + dx;
    const targetY = currentY + dy;

    // 1. Kiểm tra di chuyển trực tiếp không bị cản
    if (!this.isColliding(targetX, targetY, playerId)) {
      return { x: targetX, y: targetY, isMoving: true, didSlide: false };
    }

    // 2. Nếu bị cản: Thử áp dụng Corner Sliding (Trượt bo góc hoặc Căn giữa hành lang)
    const slideResult = this.tryCornerSliding(currentX, currentY, direction, moveDistance, targetX, targetY, playerId);
    if (slideResult.didSlide) {
      return slideResult;
    }

    // 3. Nếu không trượt được: Dịch chuyển tối đa áp sát mặt tường (Pixel-flush stopping)
    const flushPos = this.getFlushPosition(currentX, currentY, direction, moveDistance, playerId);
    return {
      x: flushPos.x,
      y: flushPos.y,
      isMoving: Math.abs(flushPos.x - currentX) > 0.001 || Math.abs(flushPos.y - currentY) > 0.001,
      didSlide: false,
    };
  }

  /**
   * Thuật toán Trượt góc và Căn giữa hành lang (Corner Sliding & Corridor Entry Auto-Centering)
   * Xử lý 2 tình huống khi gặp va chạm:
   * 1. Corridor Entry Auto-Centering (AUD-02): Ô thẳng phía trước MỞ, nhưng nhân vật bị lệch tâm
   *    (offset <= 14px) khiến mép hitbox va chạm với tường bên cạnh -> Tự động trượt về TÂM HÀNH LANG.
   * 2. T-Junction Corner Rounding: Ô thẳng phía trước BỊ CHẶN, nhưng nhân vật lệch tâm (offset <= 14px)
   *    và ô góc vuông tương ứng MỞ -> Tự động trượt vòng qua góc vào ô mở.
   */
  private tryCornerSliding(
    x: number,
    y: number,
    direction: Direction,
    slideDistance: number,
    targetX: number,
    targetY: number,
    playerId?: string
  ): { x: number; y: number; isMoving: boolean; didSlide: boolean } {
    const tileSize = GAME_DIMENSIONS.TILE_SIZE;
    const hudHeight = GAME_DIMENSIONS.HUD_HEIGHT;
    const threshold = PLAYER_CONFIG.CORNER_SLIDE_THRESHOLD;

    // ==========================================
    // TRƯỜNG HỢP 1: DI CHUYỂN NGANG (LEFT / RIGHT)
    // ==========================================
    if (direction === 'LEFT' || direction === 'RIGHT') {
      const relY = y - hudHeight;
      const currentRow = Math.floor(relY / tileSize);
      const rowCenterY = hudHeight + currentRow * tileSize + tileSize / 2;
      const diffY = y - rowCenterY; // Độ lệch tâm theo chiều dọc (> 0: lệch xuống, < 0: lệch lên)

      // AUD-03: Tính forwardCol dựa trên targetX để tránh sai số số thực float truncation
      const currentCol = Math.floor(x / tileSize);
      const forwardCol = direction === 'RIGHT'
        ? Math.max(currentCol + 1, Math.floor((targetX + this.hitboxHalfWidth) / tileSize))
        : Math.min(currentCol - 1, Math.floor((targetX - this.hitboxHalfWidth) / tileSize));

      if (Math.abs(diffY) <= threshold) {
        // Kiểm tra xem ô thẳng phía trước có đi được không
        const straightWalkable = this.isWalkableAt({ col: forwardCol, row: currentRow }, playerId);

        if (straightWalkable) {
          // AUD-02: CORRIDOR ENTRY AUTO-CENTERING (Căn giữa khi vào hành lang hẹp)
          // Ô phía trước mở nhưng bị cản do mép lệch tâm -> Trượt ngược chiều lệch để về tâm
          if (diffY > 0) {
            // Đang lệch xuống dưới -> trượt LÊN về tâm rowCenterY
            const moveY = Math.min(slideDistance, diffY);
            const newY = y - moveY;
            if (!this.isColliding(x, newY, playerId)) {
              return { x, y: newY, isMoving: true, didSlide: true };
            }
          } else if (diffY < 0) {
            // Đang lệch lên trên -> trượt XUỐNG về tâm rowCenterY
            const moveY = Math.min(slideDistance, -diffY);
            const newY = y + moveY;
            if (!this.isColliding(x, newY, playerId)) {
              return { x, y: newY, isMoving: true, didSlide: true };
            }
          }
        } else {
          // T-JUNCTION CORNER ROUNDING (Trượt vòng qua góc khi đâm vào tường ngã ba)
          // Thử trượt LÊN nếu đang lệch lên trên hoặc thẳng tâm
          if (diffY <= 0) {
            const upperCornerWalkable = this.isWalkableAt({ col: forwardCol, row: currentRow - 1 }, playerId);
            if (upperCornerWalkable) {
              const newY = y - slideDistance;
              if (!this.isColliding(x, newY, playerId)) {
                return { x, y: newY, isMoving: true, didSlide: true };
              }
            }
          }

          // Thử trượt XUỐNG nếu đang lệch xuống dưới hoặc thẳng tâm
          if (diffY >= 0) {
            const lowerCornerWalkable = this.isWalkableAt({ col: forwardCol, row: currentRow + 1 }, playerId);
            if (lowerCornerWalkable) {
              const newY = y + slideDistance;
              if (!this.isColliding(x, newY, playerId)) {
                return { x, y: newY, isMoving: true, didSlide: true };
              }
            }
          }
        }
      }
    }

    // ==========================================
    // TRƯỜNG HỢP 2: DI CHUYỂN DỌC (UP / DOWN)
    // ==========================================
    if (direction === 'UP' || direction === 'DOWN') {
      const currentCol = Math.floor(x / tileSize);
      const colCenterX = currentCol * tileSize + tileSize / 2;
      const diffX = x - colCenterX; // Độ lệch tâm theo chiều ngang (> 0: lệch phải, < 0: lệch trái)

      // AUD-03: Tính forwardRow dựa trên targetY để tránh sai số số thực float truncation
      const currentRow = Math.floor((y - hudHeight) / tileSize);
      const forwardRow = direction === 'DOWN'
        ? Math.max(currentRow + 1, Math.floor((targetY + this.hitboxHalfHeight - hudHeight) / tileSize))
        : Math.min(currentRow - 1, Math.floor((targetY - this.hitboxHalfHeight - hudHeight) / tileSize));

      if (Math.abs(diffX) <= threshold) {
        // Kiểm tra xem ô thẳng phía trước có đi được không
        const straightWalkable = this.isWalkableAt({ col: currentCol, row: forwardRow }, playerId);

        if (straightWalkable) {
          // AUD-02: CORRIDOR ENTRY AUTO-CENTERING (Căn giữa khi vào hành lang hẹp)
          // Ô phía trước mở nhưng bị cản do mép lệch tâm -> Trượt ngược chiều lệch để về tâm
          if (diffX > 0) {
            // Đang lệch sang phải -> trượt SANG TRÁI về tâm colCenterX
            const moveX = Math.min(slideDistance, diffX);
            const newX = x - moveX;
            if (!this.isColliding(newX, y, playerId)) {
              return { x: newX, y, isMoving: true, didSlide: true };
            }
          } else if (diffX < 0) {
            // Đang lệch sang trái -> trượt SANG PHẢI về tâm colCenterX
            const moveX = Math.min(slideDistance, -diffX);
            const newX = x + moveX;
            if (!this.isColliding(newX, y, playerId)) {
              return { x: newX, y, isMoving: true, didSlide: true };
            }
          }
        } else {
          // T-JUNCTION CORNER ROUNDING (Trượt vòng qua góc khi đâm vào tường ngã ba)
          // Thử trượt SANG TRÁI nếu đang lệch sang trái
          if (diffX <= 0) {
            const leftCornerWalkable = this.isWalkableAt({ col: currentCol - 1, row: forwardRow }, playerId);
            if (leftCornerWalkable) {
              const newX = x - slideDistance;
              if (!this.isColliding(newX, y, playerId)) {
                return { x: newX, y, isMoving: true, didSlide: true };
              }
            }
          }

          // Thử trượt SANG PHẢI nếu đang lệch sang phải
          if (diffX >= 0) {
            const rightCornerWalkable = this.isWalkableAt({ col: currentCol + 1, row: forwardRow }, playerId);
            if (rightCornerWalkable) {
              const newX = x + slideDistance;
              if (!this.isColliding(newX, y, playerId)) {
                return { x: newX, y, isMoving: true, didSlide: true };
              }
            }
          }
        }
      }
    }

    return { x, y, isMoving: false, didSlide: false };
  }

  /**
   * Tính toán vị trí áp sát mép vật cản (flush) khi không thể di chuyển tiếp
   */
  private getFlushPosition(
    x: number,
    y: number,
    direction: Direction,
    maxDistance: number,
    playerId?: string
  ): IWorldPosition {
    let low = 0;
    let high = maxDistance;
    let bestX = x;
    let bestY = y;

    for (let i = 0; i < 5; i++) {
      const mid = (low + high) / 2;
      let testX = x;
      let testY = y;

      if (direction === 'UP') testY = y - mid;
      else if (direction === 'DOWN') testY = y + mid;
      else if (direction === 'LEFT') testX = x - mid;
      else if (direction === 'RIGHT') testX = x + mid;

      if (!this.isColliding(testX, testY, playerId)) {
        bestX = testX;
        bestY = testY;
        low = mid;
      } else {
        high = mid;
      }
    }

    return { x: bestX, y: bestY };
  }
}
