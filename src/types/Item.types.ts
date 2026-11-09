import { IGridCoord } from './Grid.types';

export type PowerUpType = 'BOMB_UP' | 'FIRE_UP' | 'SPEED_UP';

export interface IPowerUpItem {
  readonly id: string;
  readonly type: PowerUpType;
  readonly coord: IGridCoord;
  isImmuneToBlast: boolean; // Miễn nhiễm tia nổ vừa phá gạch trong 0.4s (OD-04)
  remainingImmunityTime: number;
}
