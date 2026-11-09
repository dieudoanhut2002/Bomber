import { IGridCoord, TileType } from '@/types/Grid.types';
import {
  IBombData,
  IBombOwnerState,
  IPlaceBombOptions,
} from '@/types/Bomb.types';
import { IHitboxAABB } from '@/types/Player.types';
import { BOMB_CONFIG } from '@/config/BombConfig';
import { GridSystem } from '@/systems/GridSystem';
import { BombPassThroughManager } from '@/systems/BombPassThroughManager';
import { EventBus } from '@/core/EventBus';
import { GameEvents } from '@/core/GameEvents';

/**
 * Cấu trúc dữ liệu nội bộ của Bomb (quản lý thêm cờ giải phóng capacity)
 */
interface IBombInternal extends IBombData {
  isCapacityReleased: boolean;
}

/**
 * Hệ thống Quản lý Bom Cốt Lõi (BombSystem)
 * Chịu trách nhiệm quản lý vòng đời bom, countdown fuse, ownership và capacity.
 * Hoàn toàn độc lập với Phaser, hỗ trợ kiểm thử Headless 100% trong Vitest.
 */
export class BombSystem {
  private readonly gridSystem?: GridSystem;
  private readonly passThroughManager: BombPassThroughManager = new BombPassThroughManager();
  private readonly bombsById: Map<string, IBombInternal> = new Map();
  private readonly bombsByCoord: Map<string, IBombInternal> = new Map();
  private readonly ownerProfiles: Map<string, IBombOwnerState> = new Map();
  private nextBombIndex: number = 1;

  constructor(gridSystem?: GridSystem) {
    this.gridSystem = gridSystem;
  }

  /**
   * Truy xuất trình quản lý quyền đi xuyên quả bom (Pass-through Manager)
   */
  public getPassThroughManager(): BombPassThroughManager {
    return this.passThroughManager;
  }

  /**
   * Đăng ký hoặc khởi tạo profile quản lý cho một chủ sở hữu bom (Owner)
   */
  public registerOwner(
    ownerId: string,
    capacity: number = BOMB_CONFIG.DEFAULT_BOMB_CAPACITY
  ): IBombOwnerState {
    const validCapacity = Math.max(1, Math.floor(capacity));
    let profile = this.ownerProfiles.get(ownerId);

    if (!profile) {
      profile = {
        ownerId,
        capacity: validCapacity,
        activeCount: 0,
      };
      this.ownerProfiles.set(ownerId, profile);
    } else {
      profile.capacity = validCapacity;
    }

    return { ...profile };
  }

  /**
   * Lấy số lượng bom tối đa (capacity) của một chủ sở hữu
   */
  public getCapacity(ownerId: string): number {
    const profile = this.ownerProfiles.get(ownerId);
    return profile ? profile.capacity : BOMB_CONFIG.DEFAULT_BOMB_CAPACITY;
  }

  /**
   * Cập nhật số lượng bom tối đa cho một chủ sở hữu (ví dụ khi nhặt Power-up)
   */
  public setCapacity(ownerId: string, capacity: number): void {
    const validCapacity = Math.max(1, Math.floor(capacity));
    const profile = this.getOrCreateOwnerProfile(ownerId);
    profile.capacity = validCapacity;
  }

  /**
   * Lấy số lượng bom hiện đang active của một chủ sở hữu
   */
  public getActiveBombCount(ownerId: string): number {
    const profile = this.ownerProfiles.get(ownerId);
    return profile ? profile.activeCount : 0;
  }

  /**
   * Lấy số lượng bom còn có thể đặt của một chủ sở hữu
   */
  public getAvailableBombCount(ownerId: string): number {
    const profile = this.getOrCreateOwnerProfile(ownerId);
    return Math.max(0, profile.capacity - profile.activeCount);
  }

  /**
   * Yêu cầu đặt một quả bom mới tại tọa độ lưới chỉ định
   * Trả về IBombData nếu đặt thành công, null nếu không thỏa mãn điều kiện.
   */
  public tryPlaceBomb(options: IPlaceBombOptions): IBombData | null {
    const { ownerId, coord } = options;

    // 1. Kiểm tra tính hợp lệ của ownerId
    if (!ownerId || typeof ownerId !== 'string' || ownerId.trim().length === 0) {
      return null;
    }

    // 2. Kiểm tra tính hợp lệ của tọa độ ô lưới
    if (
      !coord ||
      !Number.isInteger(coord.col) ||
      !Number.isInteger(coord.row)
    ) {
      return null;
    }

    // 3. Nếu có GridSystem, kiểm tra tọa độ và trạng thái ô lưới
    if (this.gridSystem) {
      if (!this.gridSystem.isValidCoord(coord)) {
        return null; // Tọa độ ngoài biên bản đồ
      }

      const tile = this.gridSystem.getTile(coord);
      // Chỉ cho phép đặt trên ô sàn trống (EMPTY).
      // Không cho phép đặt trên Tường cứng, Gạch mềm, hoặc ô đã có Bom.
      if (tile !== TileType.EMPTY) {
        return null;
      }
    }

    // 4. Kiểm tra xem ô lưới này đã có quả bom nào đang hoạt động hay chưa
    const coordKey = this.getCoordKey(coord);
    if (this.bombsByCoord.has(coordKey)) {
      return null; // Đã có bom tại cell này
    }

    // 5. Kiểm tra sức chứa (Capacity) của chủ sở hữu
    const ownerProfile = this.getOrCreateOwnerProfile(ownerId);
    if (ownerProfile.activeCount >= ownerProfile.capacity) {
      return null; // Đã đạt giới hạn số lượng bom cho phép
    }

    // 6. Kiểm tra tham số blastPower (nếu có truyền vào)
    const blastPower =
      options.blastPower !== undefined
        ? options.blastPower
        : BOMB_CONFIG.DEFAULT_BLAST_POWER;

    if (
      !Number.isInteger(blastPower) ||
      blastPower < BOMB_CONFIG.MIN_BLAST_POWER ||
      blastPower > BOMB_CONFIG.MAX_BLAST_POWER
    ) {
      return null; // Bán kính nổ không hợp lệ
    }

    // 7. Kiểm tra tham số fuseDuration (nếu có truyền vào)
    const fuseDuration =
      options.fuseDuration !== undefined
        ? options.fuseDuration
        : BOMB_CONFIG.DEFAULT_FUSE_DURATION;

    if (
      !Number.isFinite(fuseDuration) ||
      fuseDuration < BOMB_CONFIG.MIN_FUSE_DURATION ||
      fuseDuration > BOMB_CONFIG.MAX_FUSE_DURATION
    ) {
      return null; // Thời gian đếm ngược không hợp lệ
    }

    // 8. Tiến hành tạo thực thể dữ liệu quả bom
    const bombId = `bomb_${this.nextBombIndex++}`;
    const bomb: IBombInternal = {
      id: bombId,
      ownerId,
      coord: { col: coord.col, row: coord.row },
      blastPower,
      fuseDuration,
      remainingTime: fuseDuration,
      state: 'ARMED',
      createdAt: Date.now(),
      isCapacityReleased: false,
    };

    // 9. Cập nhật dữ liệu quản lý
    ownerProfile.activeCount++;
    this.bombsById.set(bombId, bomb);
    this.bombsByCoord.set(coordKey, bomb);

    // 10. Cập nhật ô lưới trên GridSystem thành TileType.BOMB
    if (this.gridSystem) {
      this.gridSystem.setTile(coord, TileType.BOMB);
    }

    // 11. Cấp quyền đi xuyên quả bom cho người vừa đặt (Spatial Disjoint AABB theo ADR-013)
    this.passThroughManager.grant(ownerId, bombId);

    // 12. Phát sự kiện BOMB_PLACED qua TypedEventBus
    EventBus.emit(GameEvents.BOMB_PLACED, {
      bombId,
      ownerId,
      col: coord.col,
      row: coord.row,
      power: blastPower,
    });

    return this.cloneBombData(bomb);
  }

  /**
   * Cập nhật đếm ngược thời gian cho tất cả các quả bom đang hoạt động
   * Trả về danh sách các quả bom vừa chuyển sang trạng thái EXPLODING trong frame này.
   */
  public update(deltaSeconds: number): IBombData[] {
    // Xử lý an toàn: nếu delta không hợp lệ hoặc <= 0 thì không cập nhật
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return [];
    }

    const explodingBombs: IBombData[] = [];

    // Duyệt qua tất cả các quả bom đang được quản lý
    for (const bomb of this.bombsById.values()) {
      if (bomb.state === 'ARMED') {
        bomb.remainingTime -= deltaSeconds;

        if (bomb.remainingTime <= 0) {
          bomb.remainingTime = 0;
          this.transitionToExploding(bomb);
          explodingBombs.push(this.cloneBombData(bomb));
        }
      } else if (bomb.state === 'TRIGGERED') {
        // Bom bị kích nổ sớm sẽ phát nổ ngay ở lần update tiếp theo
        this.transitionToExploding(bomb);
        explodingBombs.push(this.cloneBombData(bomb));
      }
    }

    return explodingBombs;
  }

  /**
   * Kích nổ sớm một quả bom (chuẩn bị cho Chain Reaction ở giai đoạn sau)
   * Chuyển trạng thái từ ARMED sang TRIGGERED.
   * Trả về true nếu kích nổ sớm thành công, false nếu bom không tồn tại hoặc không ở trạng thái ARMED.
   */
  public triggerBomb(bombId: string): boolean {
    const bomb = this.bombsById.get(bombId);
    if (!bomb || bomb.state !== 'ARMED') {
      return false;
    }

    bomb.state = 'TRIGGERED';

    EventBus.emit(GameEvents.BOMB_TRIGGERED, {
      bombId: bomb.id,
      ownerId: bomb.ownerId,
      col: bomb.coord.col,
      row: bomb.coord.row,
    });

    return true;
  }

  /**
   * Kích nổ tức thì một quả bom phục vụ cơ chế nổ dây chuyền (Chain Reaction)
   * Chỉ thực thi nếu bom ở trạng thái ARMED.
   * Chuyển trạng thái ARMED -> TRIGGERED -> EXPLODING và giải phóng tài nguyên.
   * Trả về IBombData của quả bom phát nổ, hoặc null nếu không hợp lệ.
   */
  public explodeImmediately(bombId: string): IBombData | null {
    const bomb = this.bombsById.get(bombId);
    if (!bomb || bomb.state !== 'ARMED') {
      return null;
    }

    // Phát sự kiện BOMB_TRIGGERED
    bomb.state = 'TRIGGERED';
    EventBus.emit(GameEvents.BOMB_TRIGGERED, {
      bombId: bomb.id,
      ownerId: bomb.ownerId,
      col: bomb.coord.col,
      row: bomb.coord.row,
    });

    // Chuyển sang EXPLODING và giải phóng tài nguyên
    this.transitionToExploding(bomb);
    return this.cloneBombData(bomb);
  }

  /**
   * Hoàn tất vòng đời của một quả bom sau khi vụ nổ kết thúc
   * Chuyển trạng thái sang FINISHED và dọn dẹp khỏi bộ nhớ.
   * Quy tắc bắt buộc: Bomb phải đang ở trạng thái EXPLODING mới được FINISHED.
   */
  public finishBomb(bombId: string): boolean {
    const bomb = this.bombsById.get(bombId);
    if (!bomb) {
      return false;
    }

    // Không cho phép hoàn tất bom nếu chưa qua giai đoạn EXPLODING
    if (bomb.state !== 'EXPLODING') {
      return false;
    }

    bomb.state = 'FINISHED';

    // Xóa khỏi các bảng băm quản lý
    this.bombsById.delete(bombId);
    this.bombsByCoord.delete(this.getCoordKey(bomb.coord));
    this.passThroughManager.revokeBombFromAll(bombId);

    // Tuyệt đối không giải phóng capacity lần nữa ở đây (đã giải phóng khi EXPLODING)

    // Phát sự kiện BOMB_FINISHED
    EventBus.emit(GameEvents.BOMB_FINISHED, {
      bombId: bomb.id,
      ownerId: bomb.ownerId,
      col: bomb.coord.col,
      row: bomb.coord.row,
    });

    return true;
  }

  /**
   * Chuyển trạng thái một quả bom sang EXPLODING và giải phóng tài nguyên liên quan
   */
  private transitionToExploding(bomb: IBombInternal): void {
    if (bomb.state === 'EXPLODING' || bomb.state === 'FINISHED') {
      return;
    }

    bomb.state = 'EXPLODING';

    // 1. Giải phóng Capacity cho chủ sở hữu bom (chỉ giải phóng đúng 1 lần duy nhất)
    if (!bomb.isCapacityReleased) {
      bomb.isCapacityReleased = true;
      const ownerProfile = this.ownerProfiles.get(bomb.ownerId);
      if (ownerProfile) {
        ownerProfile.activeCount = Math.max(0, ownerProfile.activeCount - 1);
      }
    }

    // 2. Giải phóng ô lưới trên GridSystem về TileType.EMPTY theo ADR-013
    if (this.gridSystem) {
      // Chỉ giải phóng nếu ô đó đang là TileType.BOMB để tránh ghi đè hệ thống khác
      if (this.gridSystem.getTile(bomb.coord) === TileType.BOMB) {
        this.gridSystem.setTile(bomb.coord, TileType.EMPTY);
      }
    }

    // 3. Thu hồi quyền đi xuyên quả bom này khỏi tất cả các thực thể (Spatial Disjoint AABB theo ADR-013)
    this.passThroughManager.revokeBombFromAll(bomb.id);

    // 4. Phát sự kiện BOMB_EXPLODING và BOMB_EXPLODED
    const eventPayload = {
      bombId: bomb.id,
      ownerId: bomb.ownerId,
      col: bomb.coord.col,
      row: bomb.coord.row,
      power: bomb.blastPower,
    };

    EventBus.emit(GameEvents.BOMB_EXPLODING, eventPayload);
    EventBus.emit(GameEvents.BOMB_EXPLODED, eventPayload);
  }

  /**
   * Tìm quả bom theo ID
   */
  public getBombById(bombId: string): IBombData | null {
    const bomb = this.bombsById.get(bombId);
    return bomb ? this.cloneBombData(bomb) : null;
  }

  /**
   * Tìm quả bom tại tọa độ ô lưới chỉ định
   */
  public getBombAt(coord: IGridCoord): IBombData | null {
    const key = this.getCoordKey(coord);
    const bomb = this.bombsByCoord.get(key);
    return bomb ? this.cloneBombData(bomb) : null;
  }

  /**
   * Kiểm tra có quả bom nào đang hoạt động tại ô lưới chỉ định hay không
   */
  public isBombAt(coord: IGridCoord): boolean {
    return this.bombsByCoord.has(this.getCoordKey(coord));
  }

  /**
   * Lấy danh sách tất cả các quả bom đang hoạt động
   */
  public getAllBombs(): IBombData[] {
    return Array.from(this.bombsById.values()).map((b) => this.cloneBombData(b));
  }

  /**
   * Lấy tổng số lượng bom đang hoạt động trong toàn hệ thống
   */
  public getActiveBombsCount(): number {
    return this.bombsById.size;
  }

  /**
   * Kiểm tra và thu hồi quyền đi xuyên của một entity đối với tất cả các quả bom mà entity đang có quyền đi xuyên
   * Được gọi mỗi khi entity cập nhật vị trí AABB mới (Spatial Disjoint AABB theo ADR-013)
   */
  public checkEntityDisjoint(entityId: string, playerAABB: IHitboxAABB): void {
    const bombIds = this.passThroughManager.getPassThroughBombs(entityId);
    if (bombIds.size === 0) return;

    // Chuyển sang mảng để duyệt an toàn, tránh mutation khi revoke
    const idsToCheck = Array.from(bombIds);
    for (const bombId of idsToCheck) {
      const bomb = this.bombsById.get(bombId);
      if (!bomb) {
        this.passThroughManager.revoke(entityId, bombId);
        continue;
      }

      if (BombPassThroughManager.isDisjointFromCell(playerAABB, bomb.coord)) {
        this.passThroughManager.revoke(entityId, bombId);
      }
    }
  }

  /**
   * Kiểm tra xem một entity có quyền đi xuyên qua quả bom cụ thể hay không
   */
  public canEntityPassThrough(entityId: string, bombId: string): boolean {
    return this.passThroughManager.has(entityId, bombId);
  }

  /**
   * Dọn dẹp toàn bộ dữ liệu quản lý bom (khi Scene destroy hoặc restart)
   */
  public cleanup(): void {
    this.bombsById.clear();
    this.bombsByCoord.clear();
    this.ownerProfiles.clear();
    this.passThroughManager.clear();
  }

  private getCoordKey(coord: IGridCoord): string {
    return `${coord.col},${coord.row}`;
  }

  private getOrCreateOwnerProfile(ownerId: string): IBombOwnerState {
    let profile = this.ownerProfiles.get(ownerId);
    if (!profile) {
      profile = {
        ownerId,
        capacity: BOMB_CONFIG.DEFAULT_BOMB_CAPACITY,
        activeCount: 0,
      };
      this.ownerProfiles.set(ownerId, profile);
    }
    return profile;
  }

  private cloneBombData(bomb: IBombInternal): IBombData {
    return {
      id: bomb.id,
      ownerId: bomb.ownerId,
      coord: { ...bomb.coord },
      blastPower: bomb.blastPower,
      fuseDuration: bomb.fuseDuration,
      remainingTime: bomb.remainingTime,
      state: bomb.state,
      createdAt: bomb.createdAt,
    };
  }
}
