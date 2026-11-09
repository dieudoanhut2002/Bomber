import { IGridCoord } from '@/types/Grid.types';
import { IPowerUpItem, PowerUpType } from '@/types/Item.types';
import { GridSystem } from '@/systems/GridSystem';
import { BombSystem } from '@/systems/BombSystem';
import { ExplosionSystem } from '@/systems/ExplosionSystem';
import { Player } from '@/entities/Player';
import { GridMath } from '@/utils/GridMath';
import { EventBus } from '@/core/EventBus';
import { GameEvents } from '@/core/GameEvents';
import { SoundEffects } from '@/utils/SoundEffects';

/**
 * Hệ thống Quản lý Vật phẩm (ItemSystem - Stage 4)
 * Quản lý sinh ngẫu nhiên Power-Up khi gạch mềm vỡ, miễn nhiễm vụ nổ tức thời (OD-04),
 * thiêu rụi khi bị tia lửa quét trúng, và cấp chỉ số nâng cấp cho Player.
 */
export class ItemSystem {
  private readonly gridSystem: GridSystem;
  private readonly items: Map<string, IPowerUpItem> = new Map();
  private nextItemIndex: number = 1;

  constructor(gridSystem: GridSystem) {
    this.gridSystem = gridSystem;
  }

  /**
   * Xử lý khi một khối gạch mềm bị phá hủy
   */
  public onBrickDestroyed(coord: IGridCoord): IPowerUpItem | null {
    // Không sinh Power-Up nếu đây là ô ẩn Cửa thoát hiểm
    const exitCoord = this.gridSystem.getMap().getExitCoord();
    if (coord.col === exitCoord.col && coord.row === exitCoord.row) {
      return null;
    }

    // Tỷ lệ rơi vật phẩm: 35%
    if (Math.random() > 0.35) {
      return null;
    }

    const types: PowerUpType[] = ['BOMB_UP', 'FIRE_UP', 'SPEED_UP'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    const id = `item_${this.nextItemIndex++}_${coord.col}_${coord.row}`;
    const item: IPowerUpItem = {
      id,
      type: chosenType,
      coord: { ...coord },
      isImmuneToBlast: true,
      remainingImmunityTime: 0.4, // Miễn nhiễm 0.4s vụ nổ hiện tại (OD-04)
    };

    this.items.set(id, item);

    EventBus.emit(GameEvents.POWERUP_SPAWNED, {
      col: coord.col,
      row: coord.row,
      type: chosenType,
    });

    return item;
  }

  /**
   * Cập nhật đếm ngược miễn nhiễm, kiểm tra thiêu rụi và nhặt vật phẩm
   */
  public update(
    deltaSeconds: number,
    explosionSystem: ExplosionSystem,
    player: Player,
    bombSystem: BombSystem
  ): void {
    const playerCoord = GridMath.worldToGrid({ x: player.x, y: player.y });
    const itemsToRemove: string[] = [];

    for (const item of this.items.values()) {
      // 1. Cập nhật đếm lùi thời gian miễn nhiễm vụ nổ
      if (item.remainingImmunityTime > 0) {
        item.remainingImmunityTime -= deltaSeconds;
        if (item.remainingImmunityTime <= 0) {
          item.isImmuneToBlast = false;
        }
      }

      // 2. Tia lửa bom thiêu rụi Power-up nếu không còn miễn nhiễm
      if (!item.isImmuneToBlast && explosionSystem.isDamageActiveAt(item.coord)) {
        itemsToRemove.push(item.id);
        continue;
      }

      // 3. Player nhặt vật phẩm khi bước vào ô
      if (playerCoord.col === item.coord.col && playerCoord.row === item.coord.row) {
        this.applyPowerUp(item.type, player, bombSystem);
        itemsToRemove.push(item.id);
        SoundEffects.playItemPickup();
        EventBus.emit(GameEvents.POWERUP_COLLECTED, { type: item.type });
      }
    }

    for (const id of itemsToRemove) {
      this.items.delete(id);
    }
  }

  /**
   * Nâng cấp chỉ số cho Player và BombSystem
   */
  private applyPowerUp(type: PowerUpType, player: Player, bombSystem: BombSystem): void {
    switch (type) {
      case 'BOMB_UP': {
        const currentCap = bombSystem.getCapacity(player.getId());
        bombSystem.setCapacity(player.getId(), currentCap + 1);
        break;
      }
      case 'FIRE_UP': {
        const currentPower = player.getBlastPower();
        player.setBlastPower(currentPower + 1);
        break;
      }
      case 'SPEED_UP': {
        const currentSpeed = player.getMoveSpeed();
        player.setMoveSpeed(currentSpeed + 25);
        break;
      }
    }
  }

  public getItems(): ReadonlyArray<IPowerUpItem> {
    return Array.from(this.items.values());
  }

  public cleanup(): void {
    this.items.clear();
  }
}
