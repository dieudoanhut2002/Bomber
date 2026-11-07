import { describe, it, expect } from 'vitest';
import { GameMap } from '@/core/GameMap';
import { TileType } from '@/types/Grid.types';
import { IGameMapData } from '@/types/Map.types';

describe('GameMap (Cấu trúc Dữ liệu Biểu diễn Bản Đồ)', () => {
  const createSampleData = (): IGameMapData => ({
    width: 3,
    height: 3,
    stage: 1,
    playerSpawn: { col: 1, row: 1 },
    exitCoord: { col: 2, row: 2 },
    tiles: [
      [TileType.HARD_WALL, TileType.HARD_WALL, TileType.HARD_WALL],
      [TileType.HARD_WALL, TileType.EMPTY, TileType.HARD_WALL],
      [TileType.HARD_WALL, TileType.HARD_WALL, TileType.HARD_WALL],
    ],
  });

  it('UT-MAP-01: Khởi tạo GameMap từ dữ liệu hợp lệ', () => {
    const data = createSampleData();
    const map = new GameMap(data);

    expect(map.getWidth()).toBe(3);
    expect(map.getHeight()).toBe(3);
    expect(map.getStage()).toBe(1);
    expect(map.getPlayerSpawn()).toEqual({ col: 1, row: 1 });
    expect(map.getExitCoord()).toEqual({ col: 2, row: 2 });
    expect(map.getTile({ col: 1, row: 1 })).toBe(TileType.EMPTY);
  });

  it('UT-MAP-02: Tính bất biến (Immutability) - Thay đổi mảng đầu vào không ảnh hưởng dữ liệu trong GameMap', () => {
    const data = createSampleData();
    const map = new GameMap(data);

    // Thay đổi mảng gốc ban đầu
    data.tiles[1][1] = TileType.SOFT_BRICK;

    // Trong GameMap vẫn phải giữ nguyên là EMPTY
    expect(map.getTile({ col: 1, row: 1 })).toBe(TileType.EMPTY);
  });

  it('UT-MAP-03: cloneTiles trả về bản sao sâu không gây mutation ngược lại GameMap', () => {
    const map = new GameMap(createSampleData());
    const cloned = map.cloneTiles();

    cloned[1][1] = TileType.HARD_WALL;
    expect(map.getTile({ col: 1, row: 1 })).toBe(TileType.EMPTY);
  });

  it('UT-MAP-04: Serialization / Deserialization qua toData() và fromData()', () => {
    const originalMap = new GameMap(createSampleData());
    const exportedData = originalMap.toData();
    const recreatedMap = GameMap.fromData(exportedData);

    expect(recreatedMap.getWidth()).toBe(originalMap.getWidth());
    expect(recreatedMap.getHeight()).toBe(originalMap.getHeight());
    expect(recreatedMap.cloneTiles()).toEqual(originalMap.cloneTiles());
    expect(recreatedMap.getExitCoord()).toEqual(originalMap.getExitCoord());
  });

  it('UT-MAP-05: Từ chối truy cập và cập nhật tọa độ ngoài biên', () => {
    const map = new GameMap(createSampleData());

    expect(map.getTile({ col: -1, row: 0 })).toBeNull();
    expect(map.getTile({ col: 3, row: 0 })).toBeNull();
    expect(map.setTile({ col: -1, row: 0 }, TileType.EMPTY)).toBe(false);
    expect(map.setTile({ col: 3, row: 0 }, TileType.EMPTY)).toBe(false);
  });
});
