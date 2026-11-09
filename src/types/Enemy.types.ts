import { Direction } from './Player.types';
import { IGridCoord } from './Grid.types';

export type EnemyType = 'BALLOM' | 'ONEAL';

export interface IEnemyData {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  isAlive: boolean;
  scoreValue: number;
  lastGridCoord: IGridCoord;
}
