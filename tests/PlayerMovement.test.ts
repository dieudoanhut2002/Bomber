import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerCollisionSystem } from '@/systems/PlayerCollisionSystem';
import { GridSystem } from '@/systems/GridSystem';
import { MapGenerator } from '@/systems/MapGenerator';
import { PLAYER_CONFIG } from '@/config/PlayerConfig';

describe('Player Movement System (Tính toán vận tốc và tính nhất quán thời gian)', () => {
  let collisionSystem: PlayerCollisionSystem;

  beforeEach(() => {
    const map = MapGenerator.generate({ stage: 1, seed: 12345 });
    const gridSystem = new GridSystem(map);
    collisionSystem = new PlayerCollisionSystem(gridSystem);
  });

  it('UT-MOVE-01: Di chuyển sang PHẢI với tốc độ 120 px/s trong 0.1 giây', () => {
    // Vị trí Spawn (1, 1) -> tâm ô (72, 120)
    const startX = 72;
    const startY = 120;
    const dt = 0.1; // 100ms
    const expectedDistance = PLAYER_CONFIG.BASE_SPEED * dt; // 120 * 0.1 = 12px

    const result = collisionSystem.resolveMovement(startX, startY, 'RIGHT', dt);
    expect(result.x).toBeCloseTo(startX + expectedDistance);
    expect(result.y).toBe(startY);
    expect(result.isMoving).toBe(true);
  });

  it('UT-MOVE-02: Di chuyển XUỐNG DƯỚI với tốc độ 120 px/s trong 0.05 giây', () => {
    const startX = 72;
    const startY = 120;
    const dt = 0.05; // 50ms
    const expectedDistance = PLAYER_CONFIG.BASE_SPEED * dt; // 120 * 0.05 = 6px

    const result = collisionSystem.resolveMovement(startX, startY, 'DOWN', dt);
    expect(result.x).toBe(startX);
    expect(result.y).toBeCloseTo(startY + expectedDistance);
    expect(result.isMoving).toBe(true);
  });

  it('UT-MOVE-03: Đứng yên khi hướng là NONE hoặc deltaSeconds <= 0', () => {
    const startX = 72;
    const startY = 120;

    const resultNone = collisionSystem.resolveMovement(startX, startY, 'NONE', 0.1);
    expect(resultNone.x).toBe(startX);
    expect(resultNone.y).toBe(startY);
    expect(resultNone.isMoving).toBe(false);

    const resultZeroDt = collisionSystem.resolveMovement(startX, startY, 'RIGHT', 0);
    expect(resultZeroDt.x).toBe(startX);
    expect(resultZeroDt.y).toBe(startY);
    expect(resultZeroDt.isMoving).toBe(false);
  });

  it('UT-MOVE-04: Tính nhất quán của chuyển động không phụ thuộc Frame Rate', () => {
    const startX = 72;
    const startY = 120;
    const totalTime = 0.1; // 100ms

    // Trường hợp A: Chạy 1 frame 100ms (10 FPS)
    const result10Fps = collisionSystem.resolveMovement(startX, startY, 'RIGHT', totalTime);

    // Trường hợp B: Chạy 6 frames mỗi frame ~16.66ms (60 FPS)
    let currentX = startX;
    const dt60 = totalTime / 6;
    for (let i = 0; i < 6; i++) {
      const step = collisionSystem.resolveMovement(currentX, startY, 'RIGHT', dt60);
      currentX = step.x;
    }

    // Quãng đường đi được của 2 trường hợp phải xấp xỉ bằng nhau
    expect(result10Fps.x).toBeCloseTo(currentX, 1);
  });

  it('UT-MOVE-05: Không phát sinh giá trị NaN hoặc Infinity', () => {
    const result = collisionSystem.resolveMovement(72, 120, 'UP', 0.016);
    expect(Number.isFinite(result.x)).toBe(true);
    expect(Number.isFinite(result.y)).toBe(true);
    expect(Number.isNaN(result.x)).toBe(false);
    expect(Number.isNaN(result.y)).toBe(false);
  });

  it('UT-MOVE-06: Di chuyển sang TRÁI với tốc độ 120 px/s trong 0.1 giây (dx âm)', () => {
    // Đặt tại ô (3, 1) tâm x = 168, y = 120 (vùng hành lang trống)
    const startX = 168;
    const startY = 120;
    const dt = 0.1;
    const expectedDistance = PLAYER_CONFIG.BASE_SPEED * dt; // 12px

    const result = collisionSystem.resolveMovement(startX, startY, 'LEFT', dt);
    expect(result.x).toBeCloseTo(startX - expectedDistance);
    expect(result.y).toBe(startY);
    expect(result.isMoving).toBe(true);
  });

  it('UT-MOVE-07: Di chuyển LÊN TRÊN với tốc độ 120 px/s trong 0.05 giây (dy âm)', () => {
    // Đặt tại ô (1, 3) tâm x = 72, y = 216
    const startX = 72;
    const startY = 216;
    const dt = 0.05;
    const expectedDistance = PLAYER_CONFIG.BASE_SPEED * dt; // 6px

    const result = collisionSystem.resolveMovement(startX, startY, 'UP', dt);
    expect(result.x).toBe(startX);
    expect(result.y).toBeCloseTo(startY - expectedDistance);
    expect(result.isMoving).toBe(true);
  });

  it('UT-MOVE-08: AUD-04 - Delta-time clamping ngăn chặn lag spike khi delta cực lớn (10.0s bị clamp tối đa 0.1s)', () => {
    // Vùng spawn (1, 1) và (2, 1) luôn là sàn trống EMPTY
    const startX = 72;
    const startY = 120;
    const massiveDt = 10.0; // 10 giây (người dùng switch tab)
    const maxExpectedDistance = PLAYER_CONFIG.BASE_SPEED * 0.1; // Tối đa 12px

    const result = collisionSystem.resolveMovement(startX, startY, 'RIGHT', massiveDt);
    // Quãng đường di chuyển chỉ được tối đa 12px thay vì 1200px
    expect(result.x).toBeCloseTo(startX + maxExpectedDistance);
    expect(result.isMoving).toBe(true);
  });
});
