import { IGridCoord, TileType } from '@/types/Grid.types';
import { IGameMapData } from '@/types/Map.types';

/**
 * Lớp đại diện cho Cấu trúc Dữ liệu Bản Đồ (Map Representation)
 * Hoàn toàn độc lập với Phaser, đóng gói ma trận ô và bảo vệ tính toàn vẹn dữ liệu (Immutability).
 */
export class GameMap {
  private readonly width: number;
  private readonly height: number;
  private readonly tiles: TileType[][];
  private readonly playerSpawn: IGridCoord;
  private readonly exitCoord: IGridCoord;
  private readonly stage: number;

  constructor(data: IGameMapData) {
    this.width = data.width;
    this.height = data.height;
    this.stage = data.stage;
    this.playerSpawn = { ...data.playerSpawn };
    this.exitCoord = { ...data.exitCoord };

    // Khởi tạo bản sao sâu (Deep Copy) ma trận tiles để chống mutation ngoài ý muốn
    this.tiles = data.tiles.map((row) => [...row]);
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public getStage(): number {
    return this.stage;
  }

  public getPlayerSpawn(): IGridCoord {
    return { ...this.playerSpawn };
  }

  public getExitCoord(): IGridCoord {
    return { ...this.exitCoord };
  }

  /**
   * Lấy loại Tile tại tọa độ lưới (Col, Row)
   * Trả về null nếu tọa độ nằm ngoài biên bản đồ.
   */
  public getTile(coord: IGridCoord): TileType | null {
    if (!this.isValidCoord(coord)) {
      return null;
    }
    return this.tiles[coord.row][coord.col];
  }

  /**
   * Cập nhật loại Tile tại tọa độ lưới (Col, Row)
   * Trả về true nếu cập nhật thành công, false nếu tọa độ không hợp lệ.
   */
  public setTile(coord: IGridCoord, tile: TileType): boolean {
    if (!this.isValidCoord(coord)) {
      return false;
    }
    this.tiles[coord.row][coord.col] = tile;
    return true;
  }

  /**
   * Kiểm tra tọa độ có nằm trong phạm vi kích thước bản đồ hay không
   */
  public isValidCoord(coord: IGridCoord): boolean {
    return (
      coord.col >= 0 &&
      coord.col < this.width &&
      coord.row >= 0 &&
      coord.row < this.height
    );
  }

  /**
   * Trả về bản sao sâu (Deep Copy) toàn bộ ma trận tiles
   * Đảm bảo bên ngoài không thể can thiệp trực tiếp vào mảng dữ liệu gốc.
   */
  public cloneTiles(): TileType[][] {
    return this.tiles.map((row) => [...row]);
  }

  /**
   * Trích xuất toàn bộ dữ liệu bản đồ dưới dạng interface IGameMapData
   */
  public toData(): IGameMapData {
    return {
      width: this.width,
      height: this.height,
      stage: this.stage,
      playerSpawn: this.getPlayerSpawn(),
      exitCoord: this.getExitCoord(),
      tiles: this.cloneTiles(),
    };
  }

  /**
   * Khởi tạo đối tượng GameMap từ dữ liệu IGameMapData
   */
  public static fromData(data: IGameMapData): GameMap {
    return new GameMap(data);
  }
}
