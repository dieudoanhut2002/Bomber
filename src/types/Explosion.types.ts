import { IGridCoord, TileType } from './Grid.types';
import { IBombData } from './Bomb.types';

export type BlastDirection = 'CENTER' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

/**
 * Hằng số 4 hướng chính bất biến bảo đảm tính tất định 100% trong Raycasting & BFS (OD-10)
 */
export const CARDINAL_DIRECTIONS: ReadonlyArray<{
  readonly dir: BlastDirection;
  readonly dCol: number;
  readonly dRow: number;
}> = [
  { dir: 'UP', dCol: 0, dRow: -1 },
  { dir: 'DOWN', dCol: 0, dRow: 1 },
  { dir: 'LEFT', dCol: -1, dRow: 0 },
  { dir: 'RIGHT', dCol: 1, dRow: 0 },
] as const;

export interface IExplosionSegment {
  readonly coord: IGridCoord;
  readonly direction: BlastDirection;
  readonly isTip: boolean;
  readonly destroyedBrick: boolean;
}

export interface IBlastRayResult {
  readonly origin: IGridCoord;
  readonly power: number;
  readonly segments: ReadonlyArray<IExplosionSegment>;
  readonly destroyedBricks: ReadonlyArray<IGridCoord>;
  readonly triggeredBombs: ReadonlyArray<string>; // Danh sách bombId bị kích nổ
}

export interface IExplosionContribution {
  readonly explosionId: string; // Tham chiếu tới Authoritative Master IExplosionData (DT-05)
  readonly bombId: string;
  readonly ownerId: string;
  readonly direction: BlastDirection;
  readonly isTip: boolean;
}

export interface ICellExplosionState {
  readonly coord: IGridCoord;
  readonly contributions: Map<string, IExplosionContribution>;
}

export interface IExplosionData {
  readonly id: string;
  readonly bombId: string;
  readonly ownerId: string;
  readonly center: IGridCoord;
  readonly power: number;
  readonly segments: ReadonlyArray<IExplosionSegment>;
  damageRemainingTime: number; // Master State thời lượng sát thương (DT-05)
  visualRemainingTime: number; // Master State thời lượng thị giác (DT-05)
  readonly affectedBricks: ReadonlyArray<IGridCoord>;
}

export interface IRaycastQueryContext {
  isValidCoord(coord: IGridCoord): boolean;
  getTile(coord: IGridCoord): TileType | null;
  getBombAt(coord: IGridCoord): IBombData | null;
}

export interface IExplosionCreatedEvent {
  readonly explosionId: string;
  readonly bombId: string;
  readonly ownerId: string;
  readonly center: IGridCoord;
  readonly power: number;
  readonly segments: ReadonlyArray<IExplosionSegment>;
  readonly affectedBricks: ReadonlyArray<IGridCoord>;
  readonly triggeredBombIds: ReadonlyArray<string>;
}

export interface IExplosionFinishedEvent {
  readonly explosionId: string;
  readonly bombId: string;
  readonly ownerId: string;
  readonly affectedCells: ReadonlyArray<IGridCoord>;
}
