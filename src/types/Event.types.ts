import { GameEvents } from '@/core/GameEvents';
import { IExplosionCreatedEvent, IExplosionFinishedEvent } from './Explosion.types';

/**
 * Định nghĩa chi tiết kiểu dữ liệu payload cho từng sự kiện trong hệ thống
 */
export interface IEventPayloadMap {
  // Trạng thái Bom và Vụ nổ
  [GameEvents.BOMB_PLACED]: { bombId: string; ownerId: string; col: number; row: number; power: number };
  [GameEvents.BOMB_TRIGGERED]: { bombId: string; ownerId: string; col: number; row: number };
  [GameEvents.BOMB_EXPLODING]: { bombId: string; ownerId: string; col: number; row: number; power: number };
  [GameEvents.BOMB_EXPLODED]: { bombId: string; ownerId: string; col: number; row: number; power: number };
  [GameEvents.BOMB_FINISHED]: { bombId: string; ownerId: string; col: number; row: number };
  [GameEvents.EXPLOSION_CREATED]: IExplosionCreatedEvent;
  [GameEvents.EXPLOSION_FINISHED]: IExplosionFinishedEvent;
  [GameEvents.BLOCK_DESTROYED]: { col: number; row: number };

  // Vật phẩm bổ trợ
  [GameEvents.POWERUP_SPAWNED]: { col: number; row: number; type: string };
  [GameEvents.POWERUP_COLLECTED]: { type: string };

  // Thực thể Quái vật & Người chơi
  [GameEvents.PLAYER_MOVED]: { col: number; row: number; x: number; y: number };
  [GameEvents.PLAYER_DIRECTION_CHANGED]: { direction: string };
  [GameEvents.ENEMY_KILLED]: { enemyId: string; score: number };
  [GameEvents.ALL_ENEMIES_DEFEATED]: void;
  [GameEvents.PLAYER_HIT]: { remainingLives: number };
  [GameEvents.PLAYER_DIED]: void;

  // Luồng màn chơi và Điểm số
  [GameEvents.SCORE_CHANGED]: { currentScore: number; highScore: number };
  [GameEvents.TIMER_TICK]: { remainingSeconds: number };
  [GameEvents.STAGE_CLEARED]: { stage: number; finalScore: number };
  [GameEvents.GAME_OVER]: void;
}

export type EventKey = keyof IEventPayloadMap;
export type EventCallback<K extends EventKey> = IEventPayloadMap[K] extends void
  ? () => void
  : (payload: IEventPayloadMap[K]) => void;
