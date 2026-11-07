import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameMap } from '@/core/GameMap';
import { GridSystem } from '@/systems/GridSystem';
import { BombSystem } from '@/systems/BombSystem';
import { BombPassThroughManager } from '@/systems/BombPassThroughManager';
import { PlayerCollisionSystem } from '@/systems/PlayerCollisionSystem';
import { PlayerInputSystem } from '@/systems/PlayerInputSystem';
import { GridMath } from '@/utils/GridMath';
import { GAME_DIMENSIONS } from '@/config/GridConfig';
import { TileType } from '@/types/Grid.types';
import { EventBus } from '@/core/EventBus';

function createTestMap(): GameMap {
  const tiles: TileType[][] = Array.from({ length: 13 }, () =>
    Array.from({ length: 15 }, () => TileType.EMPTY)
  );

  for (let c = 0; c < 15; c++) {
    tiles[0][c] = TileType.HARD_WALL;
    tiles[12][c] = TileType.HARD_WALL;
  }
  for (let r = 0; r < 13; r++) {
    tiles[r][0] = TileType.HARD_WALL;
    tiles[r][14] = TileType.HARD_WALL;
  }

  return new GameMap({
    width: 15,
    height: 13,
    stage: 1,
    playerSpawn: { col: 1, row: 1 },
    exitCoord: { col: 13, row: 11 },
    tiles,
  });
}

describe('Stage 3B.2: Player Bomb Pass-through & Input Integration', () => {
  beforeEach(() => {
    EventBus.removeAllListeners();
  });

  afterEach(() => {
    EventBus.removeAllListeners();
  });

  // =========================================================================
  // GROUP 1: INPUT TESTS (Space Single-press & Key State)
  // =========================================================================
  describe('Group 1: Input Tests (Single-shot Spacebar)', () => {
    it('UT-INPUT-01: Single press of Space sets isBombJustPressed to true on first query', () => {
      const inputSystem = new PlayerInputSystem();
      expect(inputSystem.isBombJustPressed()).toBe(false);

      inputSystem.setSpaceState(true);
      expect(inputSystem.isBombJustPressed()).toBe(true);
    });

    it('UT-INPUT-02: Holding Space down returns false on subsequent queries (no repeat)', () => {
      const inputSystem = new PlayerInputSystem();
      inputSystem.setSpaceState(true);

      expect(inputSystem.isBombJustPressed()).toBe(true);
      // Next queries while still held down must return false
      expect(inputSystem.isBombJustPressed()).toBe(false);
      expect(inputSystem.isBombJustPressed()).toBe(false);
    });

    it('UT-INPUT-03: Releasing Space and pressing again returns true', () => {
      const inputSystem = new PlayerInputSystem();
      inputSystem.setSpaceState(true);
      expect(inputSystem.isBombJustPressed()).toBe(true);

      // Release key
      inputSystem.setSpaceState(false);
      expect(inputSystem.isBombJustPressed()).toBe(false);

      // Press key again
      inputSystem.setSpaceState(true);
      expect(inputSystem.isBombJustPressed()).toBe(true);
    });

    it('UT-INPUT-04: Arrow keys / WASD directions are unaffected when Space is pressed or held', () => {
      const inputSystem = new PlayerInputSystem();
      const resolver = inputSystem.getResolver();

      resolver.setDirectionState('RIGHT', true);
      expect(inputSystem.getDirection()).toBe('RIGHT');

      inputSystem.setSpaceState(true);
      expect(inputSystem.isBombJustPressed()).toBe(true);
      expect(inputSystem.getDirection()).toBe('RIGHT');

      inputSystem.setSpaceState(false);
      expect(inputSystem.getDirection()).toBe('RIGHT');
    });

    it('UT-INPUT-05: After cleanup, isBombJustPressed always returns false', () => {
      const inputSystem = new PlayerInputSystem();
      inputSystem.setSpaceState(true);
      inputSystem.cleanup();

      expect(inputSystem.isBombJustPressed()).toBe(false);
    });
  });

  // =========================================================================
  // GROUP 2: BOMB PLACEMENT LOGIC & PERMISSION GRANTING
  // =========================================================================
  describe('Group 2: Bomb Placement & Pass-Through Granting', () => {
    let map: GameMap;
    let gridSystem: GridSystem;
    let bombSystem: BombSystem;
    const playerId = 'player_1';

    beforeEach(() => {
      map = createTestMap();
      gridSystem = new GridSystem(map);
      bombSystem = new BombSystem(gridSystem);
      bombSystem.registerOwner(playerId, 2);
    });

    it('UT-PLACE-01: Drops bomb at exact grid cell occupied by player center', () => {
      const coord = { col: 1, row: 1 };
      const bomb = bombSystem.tryPlaceBomb({ ownerId: playerId, coord });

      expect(bomb).not.toBeNull();
      expect(bomb?.coord).toEqual({ col: 1, row: 1 });
      expect(gridSystem.getTile(coord)).toBe(TileType.BOMB);
    });

    it('UT-PLACE-02: Player slightly off-center inside cell snaps to correct grid coord', () => {
      const worldCenter = GridMath.gridToWorld({ col: 2, row: 1 });
      // Lệch tâm 5px theo cả 2 trục nhưng vẫn trong cùng cell
      const offCenterX = worldCenter.x + 5;
      const offCenterY = worldCenter.y - 4;
      const snappedCoord = GridMath.worldToGrid({ x: offCenterX, y: offCenterY });

      expect(snappedCoord).toEqual({ col: 2, row: 1 });
      const bomb = bombSystem.tryPlaceBomb({ ownerId: playerId, coord: snappedCoord });
      expect(bomb).not.toBeNull();
      expect(bomb?.coord).toEqual({ col: 2, row: 1 });
    });

    it('UT-PLACE-03: Dropping bomb in cell already containing a bomb is rejected', () => {
      const coord = { col: 1, row: 1 };
      const bomb1 = bombSystem.tryPlaceBomb({ ownerId: playerId, coord });
      expect(bomb1).not.toBeNull();

      // Đặt lần 2 vào cùng cell
      const bomb2 = bombSystem.tryPlaceBomb({ ownerId: playerId, coord });
      expect(bomb2).toBeNull();
      expect(bombSystem.getActiveBombCount(playerId)).toBe(1);
    });

    it('UT-PLACE-04: Dropping bomb when capacity is exhausted is rejected', () => {
      bombSystem.registerOwner(playerId, 1); // Capacity = 1

      const bomb1 = bombSystem.tryPlaceBomb({ ownerId: playerId, coord: { col: 1, row: 1 } });
      expect(bomb1).not.toBeNull();

      const bomb2 = bombSystem.tryPlaceBomb({ ownerId: playerId, coord: { col: 2, row: 1 } });
      expect(bomb2).toBeNull();
      expect(bombSystem.getActiveBombCount(playerId)).toBe(1);
    });

    it('UT-PLACE-05: Dropping bomb on Hard Wall or Soft Brick is rejected', () => {
      // (0, 0) là Hard Wall biên
      const bombWall = bombSystem.tryPlaceBomb({ ownerId: playerId, coord: { col: 0, row: 0 } });
      expect(bombWall).toBeNull();

      // Đặt Soft Brick tại (3, 1)
      gridSystem.setTile({ col: 3, row: 1 }, TileType.SOFT_BRICK);
      const bombBrick = bombSystem.tryPlaceBomb({ ownerId: playerId, coord: { col: 3, row: 1 } });
      expect(bombBrick).toBeNull();
    });

    it('UT-PLACE-06: Bomb placement immediately grants pass-through permission to owner', () => {
      const coord = { col: 1, row: 1 };
      const bomb = bombSystem.tryPlaceBomb({ ownerId: playerId, coord });
      expect(bomb).not.toBeNull();

      const passManager = bombSystem.getPassThroughManager();
      expect(passManager.has(playerId, bomb!.id)).toBe(true);
      expect(bombSystem.canEntityPassThrough(playerId, bomb!.id)).toBe(true);
    });
  });

  // =========================================================================
  // GROUP 3: SPATIAL DISJOINT AABB FORMULA & REVOCATION (ADR-013)
  // =========================================================================
  describe('Group 3: Spatial Disjoint AABB Calculation & Revocation', () => {
    const cellCoord = { col: 2, row: 2 };
    const tileSize = GAME_DIMENSIONS.TILE_SIZE; // 48
    const hudHeight = GAME_DIMENSIONS.HUD_HEIGHT; // 48
    const cellLeft = cellCoord.col * tileSize; // 96
    const cellRight = (cellCoord.col + 1) * tileSize; // 144
    const cellTop = hudHeight + cellCoord.row * tileSize; // 48 + 96 = 144
    const cellBottom = hudHeight + (cellCoord.row + 1) * tileSize; // 192

    it('UT-DISJOINT-01: Returns false when player AABB overlaps cell in any way', () => {
      // Tâm cell: (120, 168), AABB: 28x28 => left: 106, right: 134, top: 154, bottom: 182
      const centerAABB = {
        left: 106,
        right: 134,
        top: 154,
        bottom: 182,
        width: 28,
        height: 28,
        centerX: 120,
        centerY: 168,
      };
      expect(BombPassThroughManager.isDisjointFromCell(centerAABB, cellCoord)).toBe(false);

      // Lệch sang phải nhưng còn 2px bên trong cell (right = 146, left = 118; cellRight = 144)
      const partialOverlapRight = {
        ...centerAABB,
        left: 140,
        right: 168,
      };
      expect(BombPassThroughManager.isDisjointFromCell(partialOverlapRight, cellCoord)).toBe(false);
    });

    it('UT-DISJOINT-02: Returns true when player AABB is strictly outside cell in 4 directions', () => {
      // Strict RIGHT: player.left > cellRight (145 > 144)
      const rightAABB = {
        left: 145,
        right: 173,
        top: 154,
        bottom: 182,
        width: 28,
        height: 28,
        centerX: 159,
        centerY: 168,
      };
      expect(BombPassThroughManager.isDisjointFromCell(rightAABB, cellCoord)).toBe(true);

      // Strict LEFT: player.right < cellLeft (95 < 96)
      const leftAABB = {
        left: 67,
        right: 95,
        top: 154,
        bottom: 182,
        width: 28,
        height: 28,
        centerX: 81,
        centerY: 168,
      };
      expect(BombPassThroughManager.isDisjointFromCell(leftAABB, cellCoord)).toBe(true);

      // Strict TOP: player.bottom < cellTop (143 < 144)
      const topAABB = {
        left: 106,
        right: 134,
        top: 115,
        bottom: 143,
        width: 28,
        height: 28,
        centerX: 120,
        centerY: 129,
      };
      expect(BombPassThroughManager.isDisjointFromCell(topAABB, cellCoord)).toBe(true);

      // Strict BOTTOM: player.top > cellBottom (193 > 192)
      const bottomAABB = {
        left: 106,
        right: 134,
        top: 193,
        bottom: 221,
        width: 28,
        height: 28,
        centerX: 120,
        centerY: 207,
      };
      expect(BombPassThroughManager.isDisjointFromCell(bottomAABB, cellCoord)).toBe(true);
    });

    it('UT-DISJOINT-03: Boundary touch counts as disjoint per ADR-013', () => {
      // Tiếp xúc mép phải cell: player.left === cellRight (144)
      const touchRightAABB = {
        left: cellRight,
        right: cellRight + 28,
        top: 154,
        bottom: 182,
        width: 28,
        height: 28,
        centerX: cellRight + 14,
        centerY: 168,
      };
      expect(BombPassThroughManager.isDisjointFromCell(touchRightAABB, cellCoord)).toBe(true);

      // Tiếp xúc mép trái cell: player.right === cellLeft (96)
      const touchLeftAABB = {
        left: cellLeft - 28,
        right: cellLeft,
        top: 154,
        bottom: 182,
        width: 28,
        height: 28,
        centerX: cellLeft - 14,
        centerY: 168,
      };
      expect(BombPassThroughManager.isDisjointFromCell(touchLeftAABB, cellCoord)).toBe(true);

      // Tiếp xúc mép trên cell: player.bottom === cellTop (144)
      const touchTopAABB = {
        left: 106,
        right: 134,
        top: cellTop - 28,
        bottom: cellTop,
        width: 28,
        height: 28,
        centerX: 120,
        centerY: cellTop - 14,
      };
      expect(BombPassThroughManager.isDisjointFromCell(touchTopAABB, cellCoord)).toBe(true);

      // Tiếp xúc mép dưới cell: player.top === cellBottom (192)
      const touchBottomAABB = {
        left: 106,
        right: 134,
        top: cellBottom,
        bottom: cellBottom + 28,
        width: 28,
        height: 28,
        centerX: 120,
        centerY: cellBottom + 14,
      };
      expect(BombPassThroughManager.isDisjointFromCell(touchBottomAABB, cellCoord)).toBe(true);
    });
  });

  // =========================================================================
  // GROUP 4: INTEGRATED PASS-THROUGH & MOVEMENT SIMULATION
  // =========================================================================
  describe('Group 4: Integrated Pass-Through & Movement', () => {
    let map: GameMap;
    let gridSystem: GridSystem;
    let bombSystem: BombSystem;
    let collisionSystem: PlayerCollisionSystem;
    const playerId = 'player_1';

    beforeEach(() => {
      map = createTestMap();
      gridSystem = new GridSystem(map);
      bombSystem = new BombSystem(gridSystem);
      collisionSystem = new PlayerCollisionSystem(gridSystem, bombSystem);
      bombSystem.registerOwner(playerId, 2);
    });

    it('UT-PASS-01: Player not stuck upon dropping bomb, can move freely while overlapping', () => {
      const spawnWorld = GridMath.gridToWorld({ col: 1, row: 1 });
      const bomb = bombSystem.tryPlaceBomb({ ownerId: playerId, coord: { col: 1, row: 1 } });
      expect(bomb).not.toBeNull();

      // Thử di chuyển sang phải 1 bước nhỏ (0.016s * 150px/s = 2.4px)
      const res = collisionSystem.resolveMovement(spawnWorld.x, spawnWorld.y, 'RIGHT', 0.016, playerId);
      expect(res.isMoving).toBe(true);
      expect(res.x).toBeGreaterThan(spawnWorld.x);
      // Player vẫn có quyền đi xuyên
      expect(bombSystem.canEntityPassThrough(playerId, bomb!.id)).toBe(true);
    });

    it('UT-PASS-02: Moving RIGHT out of bomb cell revokes permission once fully disjoint', () => {
      const spawnWorld = GridMath.gridToWorld({ col: 1, row: 1 });
      const bomb = bombSystem.tryPlaceBomb({ ownerId: playerId, coord: { col: 1, row: 1 } });
      expect(bomb).not.toBeNull();

      let currentX = spawnWorld.x;
      let currentY = spawnWorld.y;

      // Di chuyển liên tục sang phải cho đến ô (2, 1)
      const targetWorld = GridMath.gridToWorld({ col: 2, row: 1 });
      while (currentX < targetWorld.x) {
        const moveRes = collisionSystem.resolveMovement(currentX, currentY, 'RIGHT', 0.05, playerId);
        currentX = moveRes.x;
        currentY = moveRes.y;
        const aabb = collisionSystem.getHitboxAABB(currentX, currentY);
        bombSystem.checkEntityDisjoint(playerId, aabb);
      }

      // Khi đã đến tâm ô (2, 1), AABB phải hoàn toàn disjoint khỏi ô (1, 1)
      const aabbAtTarget = collisionSystem.getHitboxAABB(targetWorld.x, targetWorld.y);
      expect(BombPassThroughManager.isDisjointFromCell(aabbAtTarget, { col: 1, row: 1 })).toBe(true);
      // Quyền đi xuyên phải bị thu hồi!
      expect(bombSystem.canEntityPassThrough(playerId, bomb!.id)).toBe(false);
    });

    it('UT-PASS-03: After revocation, Player cannot re-enter the bomb cell', () => {
      const spawnWorld = GridMath.gridToWorld({ col: 1, row: 1 });
      const bomb = bombSystem.tryPlaceBomb({ ownerId: playerId, coord: { col: 1, row: 1 } });
      expect(bomb).not.toBeNull();

      // Đưa Player sang ô (2, 1) và kích hoạt thu hồi quyền
      const targetWorld = GridMath.gridToWorld({ col: 2, row: 1 });
      let currentX = targetWorld.x;
      let currentY = targetWorld.y;
      const aabb = collisionSystem.getHitboxAABB(currentX, currentY);
      bombSystem.checkEntityDisjoint(playerId, aabb);
      expect(bombSystem.canEntityPassThrough(playerId, bomb!.id)).toBe(false);

      // Thử di chuyển ngược lại sang TRÁI (hướng về ô bom (1, 1))
      const moveLeft = collisionSystem.resolveMovement(currentX, currentY, 'LEFT', 0.1, playerId);

      // Mép trái hitbox không được vượt quá cellRight của ô (1, 1) (= 2 * 48 = 96)
      // Hitbox half width = 14 => x tối thiểu là 96 + 14 = 110
      expect(moveLeft.x).toBeGreaterThanOrEqual(96 + 14 - 0.01);
      // Di chuyển trực tiếp vào giữa ô (1, 1) phải bị cản hoàn toàn
      const directInsideBomb = collisionSystem.isColliding(spawnWorld.x, spawnWorld.y, playerId);
      expect(directInsideBomb).toBe(true);
    });

    it('UT-PASS-04: Player moves DOWN out of bomb cell -> disjoint -> cannot re-enter', () => {
      const spawnWorld = GridMath.gridToWorld({ col: 1, row: 1 });
      const bomb = bombSystem.tryPlaceBomb({ ownerId: playerId, coord: { col: 1, row: 1 } });
      expect(bomb).not.toBeNull();

      // Di chuyển xuống ô (1, 2)
      const targetWorld = GridMath.gridToWorld({ col: 1, row: 2 });
      let currentX = spawnWorld.x;
      let currentY = spawnWorld.y;

      while (currentY < targetWorld.y) {
        const moveRes = collisionSystem.resolveMovement(currentX, currentY, 'DOWN', 0.05, playerId);
        currentX = moveRes.x;
        currentY = moveRes.y;
        const aabb = collisionSystem.getHitboxAABB(currentX, currentY);
        bombSystem.checkEntityDisjoint(playerId, aabb);
      }

      expect(bombSystem.canEntityPassThrough(playerId, bomb!.id)).toBe(false);

      // Thử đi LÊN lại vào ô bom (1, 1) -> bị chặn!
      const moveUp = collisionSystem.resolveMovement(currentX, currentY, 'UP', 0.1, playerId);
      // cellBottom của (1, 1) là 48 + 2*48 = 144. Hitbox halfHeight = 14 => y tối thiểu 144 + 14 = 158
      expect(moveUp.y).toBeGreaterThanOrEqual(144 + 14 - 0.01);
    });
  });

  // =========================================================================
  // GROUP 5: MULTI-BOMB & MULTI-PLAYER ISOLATION
  // =========================================================================
  describe('Group 5: Multi-Bomb & Entity Isolation', () => {
    let map: GameMap;
    let gridSystem: GridSystem;
    let bombSystem: BombSystem;
    let collisionSystem: PlayerCollisionSystem;
    const player1 = 'player_1';
    const player2 = 'player_2';

    beforeEach(() => {
      map = createTestMap();
      gridSystem = new GridSystem(map);
      bombSystem = new BombSystem(gridSystem);
      collisionSystem = new PlayerCollisionSystem(gridSystem, bombSystem);
      bombSystem.registerOwner(player1, 2);
      bombSystem.registerOwner(player2, 2);
    });

    it('UT-MULTI-01: Leaving Bomb A revokes A but preserves Bomb B permission', () => {
      // Player 1 đặt Bomb A tại (1, 1)
      const bombA = bombSystem.tryPlaceBomb({ ownerId: player1, coord: { col: 1, row: 1 } });
      // Đi sang (2, 1)
      const world2_1 = GridMath.gridToWorld({ col: 2, row: 1 });
      // Đặt Bomb B tại (2, 1)
      const bombB = bombSystem.tryPlaceBomb({ ownerId: player1, coord: { col: 2, row: 1 } });

      expect(bombA).not.toBeNull();
      expect(bombB).not.toBeNull();

      // Tại (2, 1), kiểm tra disjoint
      const aabbAt2_1 = collisionSystem.getHitboxAABB(world2_1.x, world2_1.y);
      bombSystem.checkEntityDisjoint(player1, aabbAt2_1);

      // Bomb A đã disjoint -> revoked
      expect(bombSystem.canEntityPassThrough(player1, bombA!.id)).toBe(false);
      // Bomb B đang overlap -> preserved
      expect(bombSystem.canEntityPassThrough(player1, bombB!.id)).toBe(true);
    });

    it('UT-MULTI-02: Entity Isolation: Player 2 cannot pass through Player 1 bomb', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: player1, coord: { col: 1, row: 1 } });
      expect(bomb).not.toBeNull();

      const spawnWorld = GridMath.gridToWorld({ col: 1, row: 1 });

      // Player 1 có quyền đi xuyên
      expect(bombSystem.canEntityPassThrough(player1, bomb!.id)).toBe(true);
      expect(collisionSystem.isColliding(spawnWorld.x, spawnWorld.y, player1)).toBe(false);

      // Player 2 KHÔNG có quyền đi xuyên
      expect(bombSystem.canEntityPassThrough(player2, bomb!.id)).toBe(false);
      expect(collisionSystem.isColliding(spawnWorld.x, spawnWorld.y, player2)).toBe(true);
    });

    it('UT-MULTI-03: Exploding bomb clears pass-through permissions for all entities', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: player1, coord: { col: 1, row: 1 } });
      expect(bomb).not.toBeNull();
      expect(bombSystem.canEntityPassThrough(player1, bomb!.id)).toBe(true);

      // Cập nhật thời gian đến khi nổ (fuse = 3.0s)
      bombSystem.update(3.1);

      // Sau khi nổ, quyền đi xuyên bị thu hồi hoàn toàn
      expect(bombSystem.canEntityPassThrough(player1, bomb!.id)).toBe(false);
      // Và ô lưới trở lại EMPTY
      expect(gridSystem.getTile({ col: 1, row: 1 })).toBe(TileType.EMPTY);
    });

    it('UT-MULTI-04: System cleanup clears all pass-through permissions', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: player1, coord: { col: 1, row: 1 } });
      expect(bomb).not.toBeNull();
      expect(bombSystem.canEntityPassThrough(player1, bomb!.id)).toBe(true);

      bombSystem.cleanup();
      expect(bombSystem.canEntityPassThrough(player1, bomb!.id)).toBe(false);
      expect(bombSystem.getActiveBombsCount()).toBe(0);
    });
  });

  // =========================================================================
  // GROUP 6: CORNER SLIDING REGRESSION AROUND SOLID BOMBS
  // =========================================================================
  describe('Group 6: Corner Sliding & Regression around Solid Bombs', () => {
    let map: GameMap;
    let gridSystem: GridSystem;
    let bombSystem: BombSystem;
    let collisionSystem: PlayerCollisionSystem;
    const player1 = 'player_1';

    beforeEach(() => {
      map = createTestMap();
      gridSystem = new GridSystem(map);
      bombSystem = new BombSystem(gridSystem);
      collisionSystem = new PlayerCollisionSystem(gridSystem, bombSystem);
      bombSystem.registerOwner(player1, 2);
    });

    it('UT-CORNER-01: Solid bomb acts as 1x1 obstacle and supports flush stopping', () => {
      // Đặt bomb tại (3, 1) mà player1 KHÔNG có quyền đi xuyên (ví dụ đã revoked)
      const bomb = bombSystem.tryPlaceBomb({ ownerId: player1, coord: { col: 3, row: 1 } });
      expect(bomb).not.toBeNull();
      bombSystem.getPassThroughManager().revoke(player1, bomb!.id);

      // Player đứng tại ô (2, 1)
      const world2_1 = GridMath.gridToWorld({ col: 2, row: 1 });
      // Di chuyển sang phải đâm vào ô (3, 1)
      const moveResult = collisionSystem.resolveMovement(world2_1.x, world2_1.y, 'RIGHT', 0.5, player1);

      // Cell (3, 1) left edge = 3 * 48 = 144
      // Hitbox halfWidth = 14 => flush position x <= 144 - 14 = 130
      expect(moveResult.x).toBeLessThanOrEqual(144 - 14 + 0.01);
      expect(moveResult.x).toBeGreaterThan(world2_1.x); // Phải di chuyển được tới sát mép
    });

    it('UT-CORNER-02: Without playerId passed, bomb is treated as strictly solid obstacle', () => {
      const bomb = bombSystem.tryPlaceBomb({ ownerId: player1, coord: { col: 1, row: 1 } });
      expect(bomb).not.toBeNull();

      const spawnWorld = GridMath.gridToWorld({ col: 1, row: 1 });
      // Không truyền playerId: mặc định là solid (backward compatibility với test cũ)
      expect(collisionSystem.isColliding(spawnWorld.x, spawnWorld.y)).toBe(true);
    });
  });
});
