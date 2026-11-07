import { describe, it, expect, beforeEach } from 'vitest';
import { GridSystem } from '@/systems/GridSystem';
import { GameMap } from '@/core/GameMap';
import { TileType } from '@/types/Grid.types';
import { MapGenerator } from '@/systems/MapGenerator';

describe('GridSystem (Hệ thống Quản lý Lưới Bản Đồ)', () => {
  let gridSystem: GridSystem;
  let gameMap: GameMap;

  beforeEach(() => {
    // Khởi tạo bản đồ Stage 1 với seed cố định
    gameMap = MapGenerator.generate({ stage: 1, seed: 99999 });
    gridSystem = new GridSystem(gameMap);
  });

  it('UT-GRID-01: Khởi tạo Grid đúng kích thước 15x13', () => {
    expect(gridSystem.getMap().getWidth()).toBe(15);
    expect(gridSystem.getMap().getHeight()).toBe(13);
  });

  it('UT-GRID-02: Truy xuất Tile hợp lệ tại các vị trí trong bản đồ', () => {
    // Tường bao góc (0, 0) phải là HARD_WALL
    expect(gridSystem.getTile({ col: 0, row: 0 })).toBe(TileType.HARD_WALL);
    // Vị trí spawn (1, 1) phải là EMPTY
    expect(gridSystem.getTile({ col: 1, row: 1 })).toBe(TileType.EMPTY);
    // Trụ cột cố định (2, 2) phải là HARD_WALL
    expect(gridSystem.getTile({ col: 2, row: 2 })).toBe(TileType.HARD_WALL);
  });

  it('UT-GRID-03: Truy xuất tọa độ âm trả về null', () => {
    expect(gridSystem.getTile({ col: -1, row: 0 })).toBeNull();
    expect(gridSystem.getTile({ col: 5, row: -1 })).toBeNull();
    expect(gridSystem.getTile({ col: -5, row: -5 })).toBeNull();
  });

  it('UT-GRID-04: Truy xuất tọa độ vượt biên trả về null', () => {
    expect(gridSystem.getTile({ col: 15, row: 5 })).toBeNull();
    expect(gridSystem.getTile({ col: 5, row: 13 })).toBeNull();
    expect(gridSystem.getTile({ col: 100, row: 100 })).toBeNull();
  });

  it('UT-GRID-05: Cập nhật Tile hợp lệ trong Grid thành công', () => {
    const targetCoord = { col: 1, row: 1 };
    expect(gridSystem.getTile(targetCoord)).toBe(TileType.EMPTY);

    const success = gridSystem.setTile(targetCoord, TileType.SOFT_BRICK);
    expect(success).toBe(true);
    expect(gridSystem.getTile(targetCoord)).toBe(TileType.SOFT_BRICK);
  });

  it('UT-GRID-06: Không cho phép cập nhật Tile ngoài Grid (trả về false)', () => {
    expect(gridSystem.setTile({ col: -1, row: 5 }, TileType.EMPTY)).toBe(false);
    expect(gridSystem.setTile({ col: 15, row: 5 }, TileType.EMPTY)).toBe(false);
    expect(gridSystem.setTile({ col: 5, row: 13 }, TileType.EMPTY)).toBe(false);
  });

  it('UT-GRID-07: Kiểm tra tính năng Walkable', () => {
    // EMPTY đi được
    expect(gridSystem.isWalkable({ col: 1, row: 1 })).toBe(true);
    // HARD_WALL không đi được
    expect(gridSystem.isWalkable({ col: 0, row: 0 })).toBe(false);
    // Ngoài biên không đi được
    expect(gridSystem.isWalkable({ col: -1, row: 0 })).toBe(false);
  });

  it('UT-GRID-08: Kiểm tra tính năng Destructible', () => {
    // HARD_WALL không thể phá hủy
    expect(gridSystem.isDestructible({ col: 0, row: 0 })).toBe(false);
    // EMPTY không thể phá hủy
    expect(gridSystem.isDestructible({ col: 1, row: 1 })).toBe(false);

    // Đặt thử một SOFT_BRICK
    gridSystem.setTile({ col: 1, row: 3 }, TileType.SOFT_BRICK);
    expect(gridSystem.isDestructible({ col: 1, row: 3 })).toBe(true);
  });

  it('UT-GRID-09: Phá hủy SoftWall thành công và chuyển thành EMPTY', () => {
    const brickCoord = { col: 1, row: 3 };
    gridSystem.setTile(brickCoord, TileType.SOFT_BRICK);

    // Phá hủy gạch
    const destroyed = gridSystem.destroySoftWall(brickCoord);
    expect(destroyed).toBe(true);
    expect(gridSystem.getTile(brickCoord)).toBe(TileType.EMPTY);

    // Phá hủy lại ô đã rỗng phải trả về false
    expect(gridSystem.destroySoftWall(brickCoord)).toBe(false);
  });

  it('UT-GRID-10: Phá hủy SoftWall chứa Cửa Thoát Hiểm sẽ làm lộ diện Cửa (LOCKED)', () => {
    const exitCoord = gridSystem.getExitCoord();
    // Đảm bảo ô exit đang là SOFT_BRICK
    gridSystem.setTile(exitCoord, TileType.SOFT_BRICK);

    expect(gridSystem.isExitRevealed()).toBe(false);

    // Phá hủy gạch tại vị trí exit
    const destroyed = gridSystem.destroySoftWall(exitCoord);
    expect(destroyed).toBe(true);
    expect(gridSystem.isExitRevealed()).toBe(true);
    expect(gridSystem.getTile(exitCoord)).toBe(TileType.EXIT_DOOR_LOCKED);

    // Mở khóa cửa (khi diệt hết quái)
    expect(gridSystem.unlockExitDoor()).toBe(true);
    expect(gridSystem.getTile(exitCoord)).toBe(TileType.EXIT_DOOR_OPEN);
  });

  it('UT-GRID-11: getTilesSnapshot trả về bản sao dữ liệu an toàn (Immutability)', () => {
    const snapshot = gridSystem.getTilesSnapshot();
    expect(snapshot[1][1]).toBe(TileType.EMPTY);

    // Cố tình sửa dữ liệu snapshot bên ngoài
    snapshot[1][1] = TileType.HARD_WALL;

    // Trạng thái bên trong GridSystem không bị thay đổi
    expect(gridSystem.getTile({ col: 1, row: 1 })).toBe(TileType.EMPTY);
  });
});
