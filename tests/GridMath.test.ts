import { describe, it, expect } from 'vitest';
import { GridMath } from '@/utils/GridMath';
import { GAME_DIMENSIONS } from '@/config/GridConfig';

describe('GridMath (Tiện ích chuyển đổi tọa độ Lưới)', () => {
  // Các bài test cơ bản ban đầu
  it('UT-MATH-01: Chuyển đổi từ Ô Lưới (col: 0, row: 0) sang Tọa độ Thế giới tâm ô', () => {
    const worldPos = GridMath.gridToWorld({ col: 0, row: 0 });
    expect(worldPos.x).toBe(GAME_DIMENSIONS.TILE_SIZE / 2); // 24px
    expect(worldPos.y).toBe(GAME_DIMENSIONS.HUD_HEIGHT + GAME_DIMENSIONS.TILE_SIZE / 2); // 48 + 24 = 72px
  });

  it('UT-MATH-02: Chuyển đổi từ Ô Lưới (col: 1, row: 1) sang Tọa độ Thế giới tâm ô', () => {
    const worldPos = GridMath.gridToWorld({ col: 1, row: 1 });
    expect(worldPos.x).toBe(48 + 24); // 72px
    expect(worldPos.y).toBe(48 + 48 + 24); // 120px
  });

  it('UT-MATH-03: Chuyển đổi ngược từ Tọa độ Thế giới (x: 72, y: 120) về Ô Lưới', () => {
    const gridCoord = GridMath.worldToGrid({ x: 72, y: 120 });
    expect(gridCoord.col).toBe(1);
    expect(gridCoord.row).toBe(1);
  });

  it('UT-MATH-04: Kiểm tra tính hợp lệ của tọa độ ô trong ma trận 15x13', () => {
    expect(GridMath.isValidGridCoord({ col: 0, row: 0 })).toBe(true);
    expect(GridMath.isValidGridCoord({ col: 14, row: 12 })).toBe(true);
    expect(GridMath.isValidGridCoord({ col: 15, row: 12 })).toBe(false);
    expect(GridMath.isValidGridCoord({ col: 0, row: 13 })).toBe(false);
    expect(GridMath.isValidGridCoord({ col: -1, row: 5 })).toBe(false);
    expect(GridMath.isValidGridCoord({ col: 5, row: -1 })).toBe(false);
  });

  it('UT-MATH-05: Căn chỉnh tọa độ liên tục bất kỳ về tâm ô lưới gần nhất', () => {
    const snapped = GridMath.snapToGridCenter({ x: 80, y: 110 });
    expect(snapped.x).toBe(72);
    expect(snapped.y).toBe(120);
  });

  // ==========================================
  // BỔ SUNG CÁC EDGE CASES THEO FINDING F-04
  // ==========================================

  it('UT-MATH-EDGE-01: Xử lý tọa độ số thực dấu phẩy động (Float coords do vận tốc vật lý)', () => {
    const pos = { x: 72.84, y: 120.95 };
    const gridCoord = GridMath.worldToGrid(pos);
    expect(gridCoord.col).toBe(1);
    expect(gridCoord.row).toBe(1);
  });

  it('UT-MATH-EDGE-02: Xử lý điểm chính xác trên đường biên của bản đồ', () => {
    // x = 719.99 nằm trong cột 14 (cột cuối cùng)
    expect(GridMath.worldToGrid({ x: 719.99, y: 100 }).col).toBe(14);
    // x = 720.00 chính thức nhảy sang cột 15 (ngoài biên)
    const outRight = GridMath.worldToGrid({ x: 720.0, y: 100 });
    expect(outRight.col).toBe(15);
    expect(GridMath.isValidGridCoord(outRight)).toBe(false);

    // y = 48.00 là điểm bắt đầu chính xác của hàng 0 (ngay dưới HUD)
    expect(GridMath.worldToGrid({ x: 100, y: 48.0 }).row).toBe(0);
    // y = 47.99 nằm trong HUD
    expect(GridMath.worldToGrid({ x: 100, y: 47.99 }).row).toBe(-1);
  });

  it('UT-MATH-EDGE-03: Xử lý tọa độ trong dải HUD (0 <= y < 48)', () => {
    const inHud = GridMath.worldToGrid({ x: 150, y: 24 });
    expect(inHud.row).toBe(-1);
    expect(GridMath.isValidGridCoord(inHud)).toBe(false);
  });

  it('UT-MATH-EDGE-04: Xử lý tọa độ âm ngoài màn hình', () => {
    const negativePos = GridMath.worldToGrid({ x: -20, y: -50 });
    expect(negativePos.col).toBe(-1);
    expect(negativePos.row).toBe(-3);
    expect(GridMath.isValidGridCoord(negativePos)).toBe(false);
  });

  it('UT-MATH-EDGE-05: Kiểm tra hàm clampGridCoord với các giá trị ngoài biên', () => {
    expect(GridMath.clampGridCoord({ col: -5, row: -10 })).toEqual({ col: 0, row: 0 });
    expect(GridMath.clampGridCoord({ col: 99, row: 50 })).toEqual({ col: 14, row: 12 });
    expect(GridMath.clampGridCoord({ col: 5, row: 6 })).toEqual({ col: 5, row: 6 });
  });

  it('UT-MATH-EDGE-06: Kiểm tra clampAndSnapToGrid giữ đối tượng an toàn trong sàn đấu', () => {
    // Snap một điểm trong dải HUD (y = 20) phải tự động kéo về tâm hàng 0 (y = 72)
    const snappedFromHud = GridMath.clampAndSnapToGrid({ x: 72, y: 20 });
    expect(snappedFromHud.x).toBe(72);
    expect(snappedFromHud.y).toBe(72); // Tâm hàng 0

    // Snap một điểm ngoài biên phải (x = 800) phải tự kéo về tâm cột 14 (x = 14*48 + 24 = 696)
    const snappedFromRight = GridMath.clampAndSnapToGrid({ x: 800, y: 120 });
    expect(snappedFromRight.x).toBe(696);
    expect(snappedFromRight.y).toBe(120);
  });
});
