import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BombSystem } from '@/systems/BombSystem';
import { GridSystem } from '@/systems/GridSystem';
import { GameMap } from '@/core/GameMap';
import { TileType } from '@/types/Grid.types';
import { BOMB_CONFIG } from '@/config/BombConfig';
import { EventBus } from '@/core/EventBus';
import { GameEvents } from '@/core/GameEvents';

describe('BombSystem (Hệ thống Quản lý Bom Cốt Lõi - Stage 3B.1)', () => {
  let bombSystem: BombSystem;
  let gridSystem: GridSystem;

  beforeEach(() => {
    // Dọn dẹp toàn bộ listeners trên EventBus trước mỗi bài test
    EventBus.removeAllListeners();

    // Khởi tạo bản đồ 15x13 trống có viền tường cứng
    const tiles: TileType[][] = Array.from({ length: 13 }, () =>
      Array.from({ length: 15 }, () => TileType.EMPTY)
    );

    for (let c = 0; c < 15; c++) {
      tiles[0][c] = TileType.HARD_WALL;
      tiles[12][c] = TileType.HARD_WALL;
    }
    for (let r = 0; r < 13; r++) {
      tiles[r][0] = TileType.HARD_WALL;
      tiles[r][14] = TileType.HARD_WALL;
    }

    const map = new GameMap({
      width: 15,
      height: 13,
      stage: 1,
      playerSpawn: { col: 1, row: 1 },
      exitCoord: { col: 2, row: 2 },
      tiles,
    });

    gridSystem = new GridSystem(map);
    bombSystem = new BombSystem(gridSystem);
  });

  // =========================================================================
  // NHÓM A: BOMB CREATION (TẠO VÀ ĐẶT BOM)
  // =========================================================================
  describe('Nhóm A: Bomb Creation', () => {
    it('UT-BOMB-01: Tạo Bomb hợp lệ tại ô sàn trống -> trả về IBombData với trạng thái ARMED', () => {
      const bomb = bombSystem.tryPlaceBomb({
        ownerId: 'player_1',
        coord: { col: 1, row: 1 },
      });

      expect(bomb).not.toBeNull();
      expect(bomb?.id).toBeDefined();
      expect(bomb?.ownerId).toBe('player_1');
      expect(bomb?.coord).toEqual({ col: 1, row: 1 });
      expect(bomb?.state).toBe('ARMED');
      expect(bomb?.blastPower).toBe(BOMB_CONFIG.DEFAULT_BLAST_POWER);
      expect(bomb?.fuseDuration).toBe(BOMB_CONFIG.DEFAULT_FUSE_DURATION);
      expect(bomb?.remainingTime).toBe(BOMB_CONFIG.DEFAULT_FUSE_DURATION);
    });

    it('UT-BOMB-02: Bomb có ownerId hợp lệ và gắn đúng chủ sở hữu', () => {
      const bombP1 = bombSystem.tryPlaceBomb({ ownerId: 'player_1', coord: { col: 1, row: 1 } });
      const bombP2 = bombSystem.tryPlaceBomb({ ownerId: 'player_2', coord: { col: 3, row: 1 } });

      expect(bombP1?.ownerId).toBe('player_1');
      expect(bombP2?.ownerId).toBe('player_2');
    });

    it('UT-BOMB-03: Bomb có gridCoord hợp lệ, truy xuất bằng getBombAt và getBombById chính xác', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'player_1', coord: { col: 2, row: 1 } })!;
      
      const byId = bombSystem.getBombById(bomb.id);
      const byCoord = bombSystem.getBombAt({ col: 2, row: 1 });

      expect(byId).toEqual(bomb);
      expect(byCoord).toEqual(bomb);
      expect(bombSystem.isBombAt({ col: 2, row: 1 })).toBe(true);
      expect(bombSystem.isBombAt({ col: 5, row: 5 })).toBe(false);
    });

    it('UT-BOMB-04: Không tạo hai Bomb trên cùng một cell (trả về null)', () => {
      const bomb1 = bombSystem.tryPlaceBomb({ ownerId: 'player_1', coord: { col: 1, row: 1 } });
      expect(bomb1).not.toBeNull();

      // Thử đặt quả bom thứ hai tại cùng ô (1, 1) bởi cùng owner
      const bomb2 = bombSystem.tryPlaceBomb({ ownerId: 'player_1', coord: { col: 1, row: 1 } });
      expect(bomb2).toBeNull();

      // Thử đặt tại cùng ô bởi owner khác
      const bomb3 = bombSystem.tryPlaceBomb({ ownerId: 'player_2', coord: { col: 1, row: 1 } });
      expect(bomb3).toBeNull();
    });

    it('UT-BOMB-05: Không tạo Bomb khi owner đã đạt giới hạn capacity', () => {
      // Owner mặc định capacity = 1
      const bomb1 = bombSystem.tryPlaceBomb({ ownerId: 'player_1', coord: { col: 1, row: 1 } });
      expect(bomb1).not.toBeNull();

      // Cố gắng đặt quả thứ 2 khi capacity = 1
      const bomb2 = bombSystem.tryPlaceBomb({ ownerId: 'player_1', coord: { col: 2, row: 1 } });
      expect(bomb2).toBeNull();
    });

    it('UT-BOMB-06: Không tạo Bomb với blastPower không hợp lệ (nhỏ hơn min, lớn hơn max, float, NaN)', () => {
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, blastPower: 0 })).toBeNull();
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, blastPower: -1 })).toBeNull();
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, blastPower: 11 })).toBeNull();
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, blastPower: 1.5 })).toBeNull();
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, blastPower: NaN })).toBeNull();
    });

    it('UT-BOMB-07: Không tạo Bomb với fuseDuration không hợp lệ (nhỏ hơn min, lớn hơn max, âm, NaN, Infinity)', () => {
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 0.05 })).toBeNull();
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: -3.0 })).toBeNull();
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 15.0 })).toBeNull();
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: NaN })).toBeNull();
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: Infinity })).toBeNull();
    });

    it('UT-BOMB-08: Khi có GridSystem, không đặt được bom trên Tường cứng, Gạch mềm, hoặc ngoài biên', () => {
      // Ô (0, 0) là HARD_WALL
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 0, row: 0 } })).toBeNull();

      // Đặt gạch mềm tại ô (3, 3)
      gridSystem.setTile({ col: 3, row: 3 }, TileType.SOFT_BRICK);
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 3, row: 3 } })).toBeNull();

      // Tọa độ ngoài biên
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: -1, row: 5 } })).toBeNull();
      expect(bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 15, row: 5 } })).toBeNull();
    });
  });

  // =========================================================================
  // NHÓM B: OWNERSHIP VÀ CAPACITY (SỞ HỮU VÀ SỨC CHỨA)
  // =========================================================================
  describe('Nhóm B: Ownership và Capacity', () => {
    it('UT-OWNER-01: Capacity và Active count được tính độc lập theo từng ownerId', () => {
      bombSystem.registerOwner('p1', 2);
      bombSystem.registerOwner('p2', 3);

      expect(bombSystem.getCapacity('p1')).toBe(2);
      expect(bombSystem.getCapacity('p2')).toBe(3);
      expect(bombSystem.getActiveBombCount('p1')).toBe(0);
      expect(bombSystem.getActiveBombCount('p2')).toBe(0);
    });

    it('UT-OWNER-02: Tạo Bomb làm giảm capacity còn trống (getAvailableBombCount)', () => {
      bombSystem.registerOwner('p1', 3);
      expect(bombSystem.getAvailableBombCount('p1')).toBe(3);

      bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 } });
      expect(bombSystem.getActiveBombCount('p1')).toBe(1);
      expect(bombSystem.getAvailableBombCount('p1')).toBe(2);

      bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 2, row: 1 } });
      expect(bombSystem.getActiveBombCount('p1')).toBe(2);
      expect(bombSystem.getAvailableBombCount('p1')).toBe(1);
    });

    it('UT-OWNER-03: Bomb chuyển sang EXPLODING giải phóng capacity ngay lập tức', () => {
      bombSystem.registerOwner('p1', 1);
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 1.0 })!;
      expect(bombSystem.getAvailableBombCount('p1')).toBe(0);

      // Cập nhật thời gian hết 1.0 giây -> Bom chuyển sang EXPLODING
      const exploding = bombSystem.update(1.0);
      expect(exploding.length).toBe(1);
      expect(exploding[0].id).toBe(bomb.id);
      expect(exploding[0].state).toBe('EXPLODING');

      // Capacity phải được hồi phục ngay lập tức
      expect(bombSystem.getActiveBombCount('p1')).toBe(0);
      expect(bombSystem.getAvailableBombCount('p1')).toBe(1);

      // Có thể đặt quả bom mới ngay lập tức
      const newBomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 3, row: 1 } });
      expect(newBomb).not.toBeNull();
    });

    it('UT-OWNER-04: Capacity không được giải phóng hai lần khi bom đã EXPLODING', () => {
      bombSystem.registerOwner('p1', 1);
      bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 1.0 });

      // Frame 1: Nổ
      bombSystem.update(1.0);
      expect(bombSystem.getActiveBombCount('p1')).toBe(0);

      // Frame 2: Update tiếp -> Không được trừ activeCount thành số âm
      bombSystem.update(0.1);
      expect(bombSystem.getActiveBombCount('p1')).toBe(0);
      expect(bombSystem.getAvailableBombCount('p1')).toBe(1);
    });

    it('UT-OWNER-05: Bomb chuyển sang FINISHED không làm tăng capacity lần nữa', () => {
      bombSystem.registerOwner('p1', 2);
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 1.0 })!;
      bombSystem.update(1.0); // EXPLODING -> activeCount giảm từ 1 về 0

      expect(bombSystem.getActiveBombCount('p1')).toBe(0);
      expect(bombSystem.getAvailableBombCount('p1')).toBe(2);

      // Kết thúc vòng đời quả bom
      const finished = bombSystem.finishBomb(bomb.id);
      expect(finished).toBe(true);

      // Capacity vẫn giữ nguyên 2, activeCount không bị giảm tiếp
      expect(bombSystem.getActiveBombCount('p1')).toBe(0);
      expect(bombSystem.getAvailableBombCount('p1')).toBe(2);
    });

    it('UT-OWNER-06: Hai owner khác nhau không ảnh hưởng đến capacity của nhau', () => {
      bombSystem.registerOwner('p1', 1);
      bombSystem.registerOwner('p2', 1);

      bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 } });
      expect(bombSystem.getAvailableBombCount('p1')).toBe(0);
      expect(bombSystem.getAvailableBombCount('p2')).toBe(1); // p2 vẫn còn 1 quả

      const bombP2 = bombSystem.tryPlaceBomb({ ownerId: 'p2', coord: { col: 3, row: 1 } });
      expect(bombP2).not.toBeNull();
      expect(bombSystem.getAvailableBombCount('p2')).toBe(0);
    });
  });

  // =========================================================================
  // NHÓM C: FUSE COUNTDOWN (ĐẾM NGƯỢC THỜI GIAN NỔ)
  // =========================================================================
  describe('Nhóm C: Fuse Countdown', () => {
    it('UT-COUNTDOWN-01: Fuse giảm chính xác theo delta time', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 3.0 })!;
      
      // Update 0.05 giây (50ms)
      bombSystem.update(0.05);
      const updated = bombSystem.getBombById(bomb.id)!;
      expect(updated.remainingTime).toBeCloseTo(2.95, 3);
      expect(updated.state).toBe('ARMED');
    });

    it('UT-COUNTDOWN-02: Bomb chưa hết fuse không chuyển sang EXPLODING', () => {
      bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 3.0 });
      
      // Chạy 2.9 giây (vẫn còn 0.1s)
      for (let i = 0; i < 29; i++) {
        const exploding = bombSystem.update(0.1);
        expect(exploding.length).toBe(0);
      }
    });

    it('UT-COUNTDOWN-03: Bomb hết fuse chuyển sang EXPLODING', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 1.0 })!;

      bombSystem.update(0.9); // Còn 0.1s
      const exploding = bombSystem.update(0.1); // Đúng 1.0s

      expect(exploding.length).toBe(1);
      expect(exploding[0].id).toBe(bomb.id);
      expect(exploding[0].state).toBe('EXPLODING');
      expect(exploding[0].remainingTime).toBe(0);
    });

    it('UT-COUNTDOWN-04: Delta time bằng 0 không làm thay đổi fuse countdown', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 3.0 })!;
      
      const exploding = bombSystem.update(0);
      expect(exploding.length).toBe(0);

      const current = bombSystem.getBombById(bomb.id)!;
      expect(current.remainingTime).toBe(3.0);
    });

    it('UT-COUNTDOWN-05: Delta time âm hoặc không hợp lệ (NaN, Infinity) bị từ chối an toàn', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 3.0 })!;

      expect(bombSystem.update(-0.1)).toEqual([]);
      expect(bombSystem.update(NaN)).toEqual([]);
      expect(bombSystem.update(Infinity)).toEqual([]);

      const current = bombSystem.getBombById(bomb.id)!;
      expect(current.remainingTime).toBe(3.0);
    });

    it('UT-COUNTDOWN-06: Nhiều Bomb hết fuse trong cùng một lần update đều được xử lý chính xác', () => {
      bombSystem.registerOwner('p1', 5);
      const b1 = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 1.0 })!;
      const b2 = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 2, row: 1 }, fuseDuration: 1.0 })!;
      const b3 = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 3, row: 1 }, fuseDuration: 2.0 })!;

      const exploding = bombSystem.update(1.0);
      expect(exploding.length).toBe(2);
      expect(exploding.map((b) => b.id).sort()).toEqual([b1.id, b2.id].sort());

      // b3 vẫn còn 1.0s
      const currentB3 = bombSystem.getBombById(b3.id)!;
      expect(currentB3.state).toBe('ARMED');
      expect(currentB3.remainingTime).toBeCloseTo(1.0, 3);
    });

    it('UT-COUNTDOWN-07: Fuse không bị xử lý hai lần trong cùng một frame', () => {
      bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 1.0 });

      // Gọi update 1.0s
      const exploding1 = bombSystem.update(1.0);
      expect(exploding1.length).toBe(1);

      // Gọi update tiếp theo
      const exploding2 = bombSystem.update(0.1);
      expect(exploding2.length).toBe(0);
    });
  });

  // =========================================================================
  // NHÓM D: LIFECYCLE (VÒNG ĐỜI VÀ CHUYỂN TRẠNG THÁI)
  // =========================================================================
  describe('Nhóm D: Lifecycle State Transitions', () => {
    it('UT-LIFE-01: Luồng thông thường ARMED -> EXPLODING -> FINISHED', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 0.5 })!;
      expect(bomb.state).toBe('ARMED');

      // 1. Chuyển sang EXPLODING
      bombSystem.update(0.5);
      const exploding = bombSystem.getBombById(bomb.id)!;
      expect(exploding.state).toBe('EXPLODING');

      // 2. Chuyển sang FINISHED
      const finished = bombSystem.finishBomb(bomb.id);
      expect(finished).toBe(true);
      expect(bombSystem.getBombById(bomb.id)).toBeNull();
    });

    it('UT-LIFE-02: Luồng kích nổ sớm ARMED -> TRIGGERED -> EXPLODING -> FINISHED', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 3.0 })!;
      
      // Kích nổ sớm qua triggerBomb (chuẩn bị cho Chain Reaction)
      const triggered = bombSystem.triggerBomb(bomb.id);
      expect(triggered).toBe(true);

      const stateTriggered = bombSystem.getBombById(bomb.id)!;
      expect(stateTriggered.state).toBe('TRIGGERED');

      // Ở lần update tiếp theo, bom TRIGGERED lập tức chuyển sang EXPLODING
      const exploding = bombSystem.update(0.016);
      expect(exploding.length).toBe(1);
      expect(exploding[0].id).toBe(bomb.id);
      expect(exploding[0].state).toBe('EXPLODING');

      // Kết thúc vòng đời
      expect(bombSystem.finishBomb(bomb.id)).toBe(true);
      expect(bombSystem.getBombById(bomb.id)).toBeNull();
    });

    it('UT-LIFE-03: Không cho phép kích nổ triggerBomb hai lần hoặc khi bom không ở trạng thái ARMED', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 } })!;
      
      expect(bombSystem.triggerBomb(bomb.id)).toBe(true);
      // Gọi triggerBomb lần 2 khi bom đã TRIGGERED -> từ chối
      expect(bombSystem.triggerBomb(bomb.id)).toBe(false);

      // Cho nổ
      bombSystem.update(0.016);
      // Gọi triggerBomb khi bom đã EXPLODING -> từ chối
      expect(bombSystem.triggerBomb(bomb.id)).toBe(false);
    });

    it('UT-LIFE-04: Không cho phép kích hoạt triggerBomb khi bom đã FINISHED', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 0.1 })!;
      bombSystem.update(0.1);
      bombSystem.finishBomb(bomb.id);

      expect(bombSystem.triggerBomb(bomb.id)).toBe(false);
    });

    it('UT-LIFE-05: Không cho phép hoàn tất finishBomb trước khi bom chuyển sang EXPLODING', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 3.0 })!;
      
      // Bom đang ARMED -> từ chối kết thúc
      expect(bombSystem.finishBomb(bomb.id)).toBe(false);

      // Bom đang TRIGGERED -> từ chối kết thúc
      bombSystem.triggerBomb(bomb.id);
      expect(bombSystem.finishBomb(bomb.id)).toBe(false);
    });

    it('UT-LIFE-06: Sau khi finishBomb, bom bị loại bỏ hoàn toàn khỏi các bảng băm', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 0.1 })!;
      bombSystem.update(0.1);
      bombSystem.finishBomb(bomb.id);

      expect(bombSystem.getBombById(bomb.id)).toBeNull();
      expect(bombSystem.getBombAt({ col: 1, row: 1 })).toBeNull();
      expect(bombSystem.isBombAt({ col: 1, row: 1 })).toBe(false);
      expect(bombSystem.getActiveBombsCount()).toBe(0);
    });

    it('UT-LIFE-07: Không tồn tại Bomb trùng ID (mỗi quả bom có ID duy nhất)', () => {
      bombSystem.registerOwner('p1', 5);
      const b1 = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 } })!;
      const b2 = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 2, row: 1 } })!;
      const b3 = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 3, row: 1 } })!;

      expect(b1.id).not.toBe(b2.id);
      expect(b2.id).not.toBe(b3.id);
    });

    it('UT-LIFE-08: Khi bom EXPLODING, ô trên GridSystem được giải phóng về EMPTY theo ADR-013', () => {
      // Khi vừa đặt: GridSystem cập nhật thành TileType.BOMB
      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 1.0 });
      expect(bomb).not.toBeNull();
      expect(gridSystem.getTile({ col: 1, row: 1 })).toBe(TileType.BOMB);

      // Khi nổ: GridSystem giải phóng về TileType.EMPTY ngay lập tức
      bombSystem.update(1.0);
      expect(gridSystem.getTile({ col: 1, row: 1 })).toBe(TileType.EMPTY);
    });
  });

  // =========================================================================
  // NHÓM E: TYPED EVENTBUS (PHÁT SỰ KIỆN CHUẨN XÁC VÀ AN TOÀN)
  // =========================================================================
  describe('Nhóm E: Typed EventBus', () => {
    it('UT-EVENT-01: Event BOMB_PLACED được phát đúng một lần với đầy đủ payload', () => {
      const spy = vi.fn();
      EventBus.on(GameEvents.BOMB_PLACED, spy);

      const bomb = bombSystem.tryPlaceBomb({
        ownerId: 'player_1',
        coord: { col: 2, row: 3 },
        blastPower: 2,
      })!;

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        bombId: bomb.id,
        ownerId: 'player_1',
        col: 2,
        row: 3,
        power: 2,
      });
    });

    it('UT-EVENT-02: Event BOMB_TRIGGERED được phát đúng một lần khi bom bị kích nổ sớm', () => {
      const spy = vi.fn();
      EventBus.on(GameEvents.BOMB_TRIGGERED, spy);

      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'player_1', coord: { col: 1, row: 1 } })!;
      bombSystem.triggerBomb(bomb.id);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        bombId: bomb.id,
        ownerId: 'player_1',
        col: 1,
        row: 1,
      });
    });

    it('UT-EVENT-03: Event BOMB_EXPLODING và BOMB_EXPLODED được phát đúng một lần khi bom phát nổ', () => {
      const spyExploding = vi.fn();
      const spyExploded = vi.fn();
      EventBus.on(GameEvents.BOMB_EXPLODING, spyExploding);
      EventBus.on(GameEvents.BOMB_EXPLODED, spyExploded);

      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 1.0 })!;
      bombSystem.update(1.0);

      const expectedPayload = {
        bombId: bomb.id,
        ownerId: 'p1',
        col: 1,
        row: 1,
        power: 1,
      };

      expect(spyExploding).toHaveBeenCalledTimes(1);
      expect(spyExploding).toHaveBeenCalledWith(expectedPayload);
      expect(spyExploded).toHaveBeenCalledTimes(1);
      expect(spyExploded).toHaveBeenCalledWith(expectedPayload);
    });

    it('UT-EVENT-04: Event BOMB_FINISHED được phát đúng một lần khi bom hoàn tất vòng đời', () => {
      const spy = vi.fn();
      EventBus.on(GameEvents.BOMB_FINISHED, spy);

      const bomb = bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 1, row: 1 }, fuseDuration: 0.1 })!;
      bombSystem.update(0.1);
      bombSystem.finishBomb(bomb.id);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        bombId: bomb.id,
        ownerId: 'p1',
        col: 1,
        row: 1,
      });
    });

    it('UT-EVENT-05: Không phát event khi thao tác bị từ chối hoặc trạng thái không đổi', () => {
      const spyPlaced = vi.fn();
      EventBus.on(GameEvents.BOMB_PLACED, spyPlaced);

      // Đặt bom thất bại trên tường cứng
      bombSystem.tryPlaceBomb({ ownerId: 'p1', coord: { col: 0, row: 0 } });
      expect(spyPlaced).not.toHaveBeenCalled();

      // Trigger bom không tồn tại
      const spyTriggered = vi.fn();
      EventBus.on(GameEvents.BOMB_TRIGGERED, spyTriggered);
      bombSystem.triggerBomb('non_existent_id');
      expect(spyTriggered).not.toHaveBeenCalled();
    });
  });
});
