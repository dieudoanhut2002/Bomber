import { IGridCoord, TileType } from '@/types/Grid.types';
import { IMapGeneratorOptions } from '@/types/Map.types';
import { GAME_DIMENSIONS } from '@/config/GridConfig';
import { GameMap } from '@/core/GameMap';
import { PRNG } from '@/utils/PRNG';

/**
 * Lớp MapGenerator chịu trách nhiệm sinh bản đồ theo quy chuẩn GDD Bomberman cổ điển
 * Hoàn toàn độc lập với Phaser, hỗ trợ tính toán tất định (Deterministic) qua PRNG seed.
 */
export class MapGenerator {
  /**
   * Số lượng gạch mềm mặc định cho từng Stage theo GDD
   */
  public static readonly DEFAULT_SOFT_WALL_COUNTS: Readonly<Record<number, number>> = {
    1: 30, // Stage 1: 30 gạch mềm
    2: 42, // Stage 2: 42 gạch mềm
    3: 50, // Stage 3: 50 gạch mềm
  };

  /**
   * Sinh bản đồ hoàn chỉnh dựa trên các tùy chọn cấu hình
   */
  public static generate(options: IMapGeneratorOptions = {}): GameMap {
    const width = GAME_DIMENSIONS.GRID_COLS;   // 15 cột
    const height = GAME_DIMENSIONS.GRID_ROWS;  // 13 hàng
    const stage = options.stage ?? 1;

    // Xác định số lượng gạch mềm cần sinh
    const targetSoftWalls =
      options.softWallCount ?? this.DEFAULT_SOFT_WALL_COUNTS[stage] ?? 30;

    // Khởi tạo bộ sinh số giả ngẫu nhiên có kiểm soát
    const prng = new PRNG(options.seed ?? Date.now());

    // 1. Khởi tạo ma trận rỗng toàn bộ
    const tiles: TileType[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => TileType.EMPTY)
    );

    // 2. Tạo Tường cứng bao quanh (Perimeter Borders)
    for (let c = 0; c < width; c++) {
      tiles[0][c] = TileType.HARD_WALL;              // Hàng trên cùng (0)
      tiles[height - 1][c] = TileType.HARD_WALL;     // Hàng dưới cùng (12)
    }
    for (let r = 0; r < height; r++) {
      tiles[r][0] = TileType.HARD_WALL;              // Cột ngoài cùng bên trái (0)
      tiles[r][width - 1] = TileType.HARD_WALL;      // Cột ngoài cùng bên phải (14)
    }

    // 3. Tạo các Trụ cột cứng cố định (Fixed Pillars: chẵn cả hàng và cột)
    for (let r = 2; r < height - 1; r += 2) {
      for (let c = 2; c < width - 1; c += 2) {
        tiles[r][c] = TileType.HARD_WALL;
      }
    }

    // 4. Xác định vị trí xuất phát và vùng an toàn (Safe Zone)
    const playerSpawn: IGridCoord = options.playerSpawn ?? { col: 1, row: 1 };
    const safeCoords: IGridCoord[] = [
      { col: playerSpawn.col, row: playerSpawn.row },
      { col: playerSpawn.col, row: playerSpawn.row + 1 }, // (1, 2)
      { col: playerSpawn.col + 1, row: playerSpawn.row }, // (2, 1)
    ];

    const isSafeCoord = (col: number, row: number): boolean => {
      return safeCoords.some((sc) => sc.col === col && sc.row === row);
    };

    // 5. Thu thập danh sách các ô khả dụng để đặt gạch mềm (Soft Walls)
    const candidateCoords: IGridCoord[] = [];
    for (let r = 1; r < height - 1; r++) {
      for (let c = 1; c < width - 1; c++) {
        // Chỉ chọn ô đang trống và không thuộc vùng an toàn
        if (tiles[r][c] === TileType.EMPTY && !isSafeCoord(c, r)) {
          candidateCoords.push({ col: c, row: r });
        }
      }
    }

    // 6. Xáo trộn ngẫu nhiên danh sách ứng viên bằng PRNG seed
    const shuffledCandidates = prng.shuffle(candidateCoords);

    // Giới hạn số lượng thực tế không vượt quá số ô trống khả dụng
    const actualSoftWallCount = Math.min(targetSoftWalls, shuffledCandidates.length);
    const softWallCoords = shuffledCandidates.slice(0, actualSoftWallCount);

    // Điền gạch mềm vào ma trận
    for (const coord of softWallCoords) {
      tiles[coord.row][coord.col] = TileType.SOFT_BRICK;
    }

    // 7. Xác định vị trí Cửa Thoát Hiểm (Exit Door)
    let exitCoord: IGridCoord;
    if (options.customExitCoord) {
      exitCoord = { ...options.customExitCoord };
    } else if (softWallCoords.length > 0) {
      // Chọn ngẫu nhiên 1 trong các ô gạch mềm đã đặt để ẩn Cửa
      const exitIndex = prng.nextInt(0, softWallCoords.length - 1);
      exitCoord = { ...softWallCoords[exitIndex] };
    } else {
      // Trường hợp không có gạch mềm nào, đặt ở góc đối diện hợp lệ
      exitCoord = { col: width - 2, row: height - 2 };
    }

    return new GameMap({
      width,
      height,
      stage,
      playerSpawn,
      exitCoord,
      tiles,
    });
  }
}
