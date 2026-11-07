import { IGridCoord, TileType } from '@/types/Grid.types';
import { isTileWalkable, isTileDestructible, doesTileBlockBlast } from '@/types/Tile.types';
import { GameMap } from '@/core/GameMap';
import { GridMath } from '@/utils/GridMath';

/**
 * Hệ thống Quản lý Lưới Ma Trận (GridSystem)
 * Chịu trách nhiệm quản lý trạng thái động của các ô bản đồ trong quá trình chơi.
 * Hoàn toàn độc lập với Phaser Scene và có thể kiểm thử Headless 100%.
 */
export class GridSystem {
  private readonly map: GameMap;
  private isExitDoorRevealed: boolean = false;

  constructor(map: GameMap) {
    // Khởi tạo hệ thống bằng một đối tượng GameMap
    this.map = map;
  }

  /**
   * Lấy loại Tile tại vị trí lưới
   * Trả về null nếu tọa độ nằm ngoài biên bản đồ.
   */
  public getTile(coord: IGridCoord): TileType | null {
    if (!this.isValidCoord(coord)) {
      return null;
    }
    return this.map.getTile(coord);
  }

  /**
   * Cập nhật loại Tile tại vị trí lưới
   * Trả về true nếu thành công, false nếu tọa độ không hợp lệ.
   */
  public setTile(coord: IGridCoord, tile: TileType): boolean {
    if (!this.isValidCoord(coord)) {
      return false;
    }
    return this.map.setTile(coord, tile);
  }

  /**
   * Kiểm tra tọa độ có nằm trong phạm vi ma trận hợp lệ hay không
   */
  public isValidCoord(coord: IGridCoord): boolean {
    return GridMath.isValidGridCoord(coord);
  }

  /**
   * Kiểm tra một ô có thể bước vào (Walkable) hay không
   * Tọa độ ngoài biên luôn trả về false.
   */
  public isWalkable(coord: IGridCoord): boolean {
    const tile = this.getTile(coord);
    if (tile === null) return false;
    return isTileWalkable(tile);
  }

  /**
   * Kiểm tra một ô có thể bị phá hủy bởi vụ nổ hay không
   * Tường cứng và ô trống trả về false; Gạch mềm trả về true.
   */
  public isDestructible(coord: IGridCoord): boolean {
    const tile = this.getTile(coord);
    if (tile === null) return false;
    return isTileDestructible(tile);
  }

  /**
   * Kiểm tra một ô có chặn tia lửa nổ lan truyền tiếp hay không
   */
  public blocksBlast(coord: IGridCoord): boolean {
    const tile = this.getTile(coord);
    if (tile === null) return true; // Ngoài biên coi như chặn tia lửa
    return doesTileBlockBlast(tile);
  }

  /**
   * Phá hủy một khối gạch mềm tại tọa độ chỉ định
   * Nếu ô đó ẩn Cửa Thoát Hiểm, cửa sẽ lộ diện (EXIT_DOOR_LOCKED).
   * Nếu không, ô sẽ chuyển thành ô sàn trống (EMPTY).
   * Trả về true nếu phá hủy thành công gạch mềm, false nếu ô không phải gạch mềm.
   */
  public destroySoftWall(coord: IGridCoord): boolean {
    if (!this.isValidCoord(coord)) return false;

    const currentTile = this.getTile(coord);
    if (currentTile !== TileType.SOFT_BRICK) {
      return false;
    }

    const exitCoord = this.map.getExitCoord();
    if (coord.col === exitCoord.col && coord.row === exitCoord.row) {
      // Lộ diện Cửa thoát hiểm (ở trạng thái Khóa ban đầu)
      this.isExitDoorRevealed = true;
      this.setTile(coord, TileType.EXIT_DOOR_LOCKED);
    } else {
      // Chuyển thành ô sàn trống
      this.setTile(coord, TileType.EMPTY);
    }

    return true;
  }

  /**
   * Mở khóa Cửa Thoát Hiểm (khi toàn bộ quái vật đã bị tiêu diệt)
   * Trả về true nếu mở khóa thành công, false nếu cửa chưa lộ diện.
   */
  public unlockExitDoor(): boolean {
    if (!this.isExitDoorRevealed) return false;

    const exitCoord = this.map.getExitCoord();
    this.setTile(exitCoord, TileType.EXIT_DOOR_OPEN);
    return true;
  }

  /**
   * Lấy vị trí Cửa Thoát Hiểm của bản đồ
   */
  public getExitCoord(): IGridCoord {
    return this.map.getExitCoord();
  }

  /**
   * Lấy vị trí xuất phát của Player
   */
  public getPlayerSpawn(): IGridCoord {
    return this.map.getPlayerSpawn();
  }

  /**
   * Kiểm tra Cửa Thoát Hiểm đã lộ diện hay chưa
   */
  public isExitRevealed(): boolean {
    return this.isExitDoorRevealed;
  }

  /**
   * Trả về bản sao sâu (Snapshot) toàn bộ dữ liệu ma trận ô
   * Ngăn chặn việc sửa đổi trực tiếp trạng thái nội bộ ngoài ý muốn.
   */
  public getTilesSnapshot(): TileType[][] {
    return this.map.cloneTiles();
  }

  /**
   * Trả về tham chiếu đối tượng GameMap
   */
  public getMap(): GameMap {
    return this.map;
  }
}
