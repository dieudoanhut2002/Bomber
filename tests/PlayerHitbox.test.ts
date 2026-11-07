import { describe, it, expect } from 'vitest';
import { PLAYER_CONFIG, PLAYER_HITBOX_OFFSET } from '@/config/PlayerConfig';
import { PlayerCollisionSystem } from '@/systems/PlayerCollisionSystem';
import { GridSystem } from '@/systems/GridSystem';
import { MapGenerator } from '@/systems/MapGenerator';

describe('Player Hitbox Specification (Hitbox 28x28 căn giữa)', () => {
  it('UT-HITBOX-01: Kích thước Hitbox phải là 28x28 pixel theo đúng GDD', () => {
    expect(PLAYER_CONFIG.HITBOX_WIDTH).toBe(28);
    expect(PLAYER_CONFIG.HITBOX_HEIGHT).toBe(28);
    expect(PLAYER_CONFIG.SPRITE_SIZE).toBe(48);
  });

  it('UT-HITBOX-02: Offset căn giữa Hitbox 28x28 trên Sprite 48x48 là 10px', () => {
    expect(PLAYER_HITBOX_OFFSET.x).toBe((48 - 28) / 2); // 10px
    expect(PLAYER_HITBOX_OFFSET.y).toBe((48 - 28) / 2); // 10px
  });

  it('UT-HITBOX-03: Tọa độ AABB của Hitbox được tính toán chính xác quanh tâm nhân vật', () => {
    const map = MapGenerator.generate({ stage: 1, seed: 123 });
    const gridSystem = new GridSystem(map);
    const collisionSystem = new PlayerCollisionSystem(gridSystem);

    const centerX = 72;
    const centerY = 120;
    const aabb = collisionSystem.getHitboxAABB(centerX, centerY);

    expect(aabb.width).toBe(28);
    expect(aabb.height).toBe(28);
    expect(aabb.left).toBe(centerX - 14); // 58px
    expect(aabb.right).toBe(centerX + 14); // 86px
    expect(aabb.top).toBe(centerY - 14); // 106px
    expect(aabb.bottom).toBe(centerY + 14); // 134px
    expect(aabb.centerX).toBe(centerX);
    expect(aabb.centerY).toBe(centerY);
  });

  it('UT-HITBOX-04: Hitbox di chuyển đồng bộ với tọa độ người chơi', () => {
    const map = MapGenerator.generate({ stage: 1, seed: 123 });
    const gridSystem = new GridSystem(map);
    const collisionSystem = new PlayerCollisionSystem(gridSystem);

    const aabb1 = collisionSystem.getHitboxAABB(100, 100);
    const aabb2 = collisionSystem.getHitboxAABB(110, 105);

    expect(aabb2.left - aabb1.left).toBe(10);
    expect(aabb2.top - aabb1.top).toBe(5);
  });
});
