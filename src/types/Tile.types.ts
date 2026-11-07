import { TileType } from '@/types/Grid.types';

/**
 * Thuộc tính hành vi của một loại ô lưới (Tile Properties)
 */
export interface ITileProperties {
  readonly isWalkable: boolean;     // Thực thể có thể di chuyển xuyên qua hay không
  readonly isDestructible: boolean; // Có thể bị phá hủy bởi vụ nổ hay không
  readonly blocksBlast: boolean;    // Có chặn tia lửa nổ lan truyền tiếp hay không
}

/**
 * Bảng ánh xạ thuộc tính hành vi chuẩn cho từng loại Tile theo GDD
 */
export const TILE_PROPERTIES: Readonly<Record<TileType, ITileProperties>> = {
  [TileType.EMPTY]: {
    isWalkable: true,
    isDestructible: false,
    blocksBlast: false,
  },
  [TileType.HARD_WALL]: {
    isWalkable: false,
    isDestructible: false,
    blocksBlast: true,
  },
  [TileType.SOFT_BRICK]: {
    isWalkable: false,
    isDestructible: true,
    blocksBlast: true,
  },
  [TileType.BOMB]: {
    isWalkable: false,
    isDestructible: true, // Nổ dây chuyền khi gặp tia lửa
    blocksBlast: false,
  },
  [TileType.EXIT_DOOR_LOCKED]: {
    isWalkable: true,
    isDestructible: false,
    blocksBlast: false,
  },
  [TileType.EXIT_DOOR_OPEN]: {
    isWalkable: true,
    isDestructible: false,
    blocksBlast: false,
  },
};

/**
 * Các hàm tiện ích thuần túy kiểm tra thuộc tính Tile
 */
export function getTileProperties(tile: TileType): ITileProperties {
  return TILE_PROPERTIES[tile] ?? TILE_PROPERTIES[TileType.EMPTY];
}

export function isTileWalkable(tile: TileType): boolean {
  return getTileProperties(tile).isWalkable;
}

export function isTileDestructible(tile: TileType): boolean {
  return getTileProperties(tile).isDestructible;
}

export function doesTileBlockBlast(tile: TileType): boolean {
  return getTileProperties(tile).blocksBlast;
}
