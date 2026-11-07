import { IGridCoord } from '@/types/Grid.types';
import { IHitboxAABB } from '@/types/Player.types';
import { GAME_DIMENSIONS } from '@/config/GridConfig';

/**
 * Quản lý quyền đi xuyên quả bom vừa đặt (Player Bomb Pass-through Manager)
 * Tuân thủ nghiêm ngặt quyết định kiến trúc ADR-013:
 * 1. Sử dụng thuật toán Spatial Disjoint AABB (loại bỏ hoàn toàn timer 0.2s).
 * 2. Quyền đi xuyên được quản lý độc lập theo từng Player và từng Bomb:
 *    Map<playerId, Set<bombId>>
 * 3. Hoàn toàn độc lập với Phaser, hỗ trợ kiểm thử Headless 100% trong Vitest.
 */
export class BombPassThroughManager {
  // Bảng ánh xạ: playerId -> Tập hợp các bombId mà Player đó có quyền đi xuyên
  private readonly permissions: Map<string, Set<string>> = new Map();

  /**
   * Cấp quyền đi xuyên quả bom cho một thực thể (Player)
   */
  public grant(playerId: string, bombId: string): void {
    if (!playerId || !bombId) return;

    let set = this.permissions.get(playerId);
    if (!set) {
      set = new Set<string>();
      this.permissions.set(playerId, set);
    }
    set.add(bombId);
  }

  /**
   * Kiểm tra xem Player có quyền đi xuyên quả bom cụ thể hay không
   */
  public has(playerId: string, bombId: string): boolean {
    const set = this.permissions.get(playerId);
    return set ? set.has(bombId) : false;
  }

  /**
   * Thu hồi quyền đi xuyên một quả bom của một Player
   */
  public revoke(playerId: string, bombId: string): void {
    const set = this.permissions.get(playerId);
    if (set) {
      set.delete(bombId);
      if (set.size === 0) {
        this.permissions.delete(playerId);
      }
    }
  }

  /**
   * Thu hồi quyền đi xuyên một quả bom khỏi TẤT CẢ các thực thể
   * (Được gọi khi quả bom chuyển sang EXPLODING hoặc FINISHED)
   */
  public revokeBombFromAll(bombId: string): void {
    for (const [playerId, set] of this.permissions.entries()) {
      set.delete(bombId);
      if (set.size === 0) {
        this.permissions.delete(playerId);
      }
    }
  }

  /**
   * Lấy tập hợp các bombId mà Player đang có quyền đi xuyên
   */
  public getPassThroughBombs(playerId: string): ReadonlySet<string> {
    return this.permissions.get(playerId) ?? new Set<string>();
  }

  /**
   * Thuật toán kiểm tra Player AABB đã rời hoàn toàn khỏi ô chứa bom hay chưa (Spatial Disjoint AABB)
   * Theo đặc tả ADR-013:
   * Ô bom có vùng tọa độ: [cellLeft, cellRight] x [cellTop, cellBottom]
   * Player được coi là ĐÃ HOÀN TOÀN RỜI KHỎI khi:
   * player.right <= cellLeft || player.left >= cellRight || player.bottom <= cellTop || player.top >= cellBottom
   * (Điều kiện tiếp xúc đúng biên được xem là đã rời khỏi cell).
   */
  public static isDisjointFromCell(playerAABB: IHitboxAABB, cellCoord: IGridCoord): boolean {
    const cellLeft = cellCoord.col * GAME_DIMENSIONS.TILE_SIZE;
    const cellRight = (cellCoord.col + 1) * GAME_DIMENSIONS.TILE_SIZE;
    const cellTop = GAME_DIMENSIONS.HUD_HEIGHT + cellCoord.row * GAME_DIMENSIONS.TILE_SIZE;
    const cellBottom = GAME_DIMENSIONS.HUD_HEIGHT + (cellCoord.row + 1) * GAME_DIMENSIONS.TILE_SIZE;

    return (
      playerAABB.right <= cellLeft ||
      playerAABB.left >= cellRight ||
      playerAABB.bottom <= cellTop ||
      playerAABB.top >= cellBottom
    );
  }

  /**
   * Kiểm tra xem Player AABB có đang còn giao nhau (Overlap) với ô chứa bom hay không
   */
  public static isOverlappingCell(playerAABB: IHitboxAABB, cellCoord: IGridCoord): boolean {
    return !BombPassThroughManager.isDisjointFromCell(playerAABB, cellCoord);
  }

  /**
   * Xóa toàn bộ quyền đi xuyên trong hệ thống (dùng khi cleanup / restart)
   */
  public clear(): void {
    this.permissions.clear();
  }
}
