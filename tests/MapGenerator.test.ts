import { describe, it, expect } from 'vitest';
import { MapGenerator } from '@/systems/MapGenerator';
import { TileType } from '@/types/Grid.types';

describe('MapGenerator (Thuật toán Sinh Bản Đồ Tất Định)', () => {
  it('UT-MAPGEN-01: Sinh bản đồ đúng kích thước 15 cột x 13 hàng', () => {
    const map = MapGenerator.generate({ stage: 1, seed: 12345 });
    expect(map.getWidth()).toBe(15);
    expect(map.getHeight()).toBe(13);
  });

  it('UT-MAPGEN-02: Tính tất định (Deterministic) - Cùng Seed sinh ra bản đồ giống hệt 100%', () => {
    const mapA = MapGenerator.generate({ stage: 1, seed: 'BOMBER_SEED_TEST' });
    const mapB = MapGenerator.generate({ stage: 1, seed: 'BOMBER_SEED_TEST' });

    expect(mapA.cloneTiles()).toEqual(mapB.cloneTiles());
    expect(mapA.getExitCoord()).toEqual(mapB.getExitCoord());
    expect(mapA.getPlayerSpawn()).toEqual(mapB.getPlayerSpawn());
  });

  it('UT-MAPGEN-03: Seed khác nhau tạo ra bố cục gạch mềm khác nhau', () => {
    const mapA = MapGenerator.generate({ stage: 1, seed: 11111 });
    const mapB = MapGenerator.generate({ stage: 1, seed: 99999 });

    expect(mapA.cloneTiles()).not.toEqual(mapB.cloneTiles());
  });

  it('UT-MAPGEN-04: Tường bao quanh (Perimeter Border) 100% là HARD_WALL', () => {
    const map = MapGenerator.generate({ stage: 1, seed: 42 });

    for (let c = 0; c < 15; c++) {
      expect(map.getTile({ col: c, row: 0 })).toBe(TileType.HARD_WALL);
      expect(map.getTile({ col: c, row: 12 })).toBe(TileType.HARD_WALL);
    }
    for (let r = 0; r < 13; r++) {
      expect(map.getTile({ col: 0, row: r })).toBe(TileType.HARD_WALL);
      expect(map.getTile({ col: 14, row: r })).toBe(TileType.HARD_WALL);
    }
  });

  it('UT-MAPGEN-05: Toàn bộ Trụ cột cố định (Fixed Pillars) là HARD_WALL', () => {
    const map = MapGenerator.generate({ stage: 1, seed: 42 });

    for (let r = 2; r <= 10; r += 2) {
      for (let c = 2; c <= 12; c += 2) {
        expect(map.getTile({ col: c, row: r })).toBe(TileType.HARD_WALL);
      }
    }
  });

  it('UT-MAPGEN-06: Vùng an toàn của Player (1,1), (1,2), (2,1) luôn là EMPTY', () => {
    // Thử nghiệm với nhiều seed khác nhau
    const seeds = [1, 42, 999, 'RANDOM_1', 'RANDOM_2'];

    for (const seed of seeds) {
      const map = MapGenerator.generate({ stage: 1, seed });
      expect(map.getTile({ col: 1, row: 1 })).toBe(TileType.EMPTY);
      expect(map.getTile({ col: 1, row: 2 })).toBe(TileType.EMPTY);
      expect(map.getTile({ col: 2, row: 1 })).toBe(TileType.EMPTY);
    }
  });

  it('UT-MAPGEN-07: Số lượng gạch mềm chính xác theo cấu hình từng Stage trong GDD', () => {
    const countSoftBricks = (map: ReturnType<typeof MapGenerator.generate>): number => {
      let count = 0;
      const tiles = map.cloneTiles();
      for (const row of tiles) {
        for (const tile of row) {
          if (tile === TileType.SOFT_BRICK) count++;
        }
      }
      return count;
    };

    // Stage 1: 30 gạch mềm
    const mapStage1 = MapGenerator.generate({ stage: 1, seed: 101 });
    expect(countSoftBricks(mapStage1)).toBe(30);

    // Stage 2: 42 gạch mềm
    const mapStage2 = MapGenerator.generate({ stage: 2, seed: 202 });
    expect(countSoftBricks(mapStage2)).toBe(42);

    // Stage 3: 50 gạch mềm
    const mapStage3 = MapGenerator.generate({ stage: 3, seed: 303 });
    expect(countSoftBricks(mapStage3)).toBe(50);
  });

  it('UT-MAPGEN-08: Vị trí Cửa Thoát Hiểm nằm ẩn dưới 1 khối gạch mềm hợp lệ', () => {
    const map = MapGenerator.generate({ stage: 1, seed: 7777 });
    const exitCoord = map.getExitCoord();

    // Tọa độ phải nằm trong lưới
    expect(map.isValidCoord(exitCoord)).toBe(true);
    // Ô chứa cửa phải ban đầu là SOFT_BRICK (ẩn dưới gạch)
    expect(map.getTile(exitCoord)).toBe(TileType.SOFT_BRICK);
  });
});
