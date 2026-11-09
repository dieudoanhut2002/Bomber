import { EventBus } from '@/core/EventBus';
import { GameEvents } from '@/core/GameEvents';

const STORAGE_KEY = 'bomber_high_score';

/**
 * Hệ thống Quản lý Điểm số, Mạng và Thời gian (ScoreSystem - Stage 6)
 * Lưu trữ điểm cao kỷ lục vào localStorage, quản lý 3 mạng, đếm ngược 200s,
 * và tính điểm thưởng khi phá đảo.
 */
export class ScoreSystem {
  private score: number = 0;
  private highScore: number = 0;
  private lives: number = 3;
  private remainingTime: number = 200;
  private currentStage: number = 1;

  constructor() {
    this.loadHighScore();
  }

  private loadHighScore(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          this.highScore = parseInt(saved, 10) || 0;
        }
      }
    } catch {
      this.highScore = 0;
    }
  }

  public saveHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, this.highScore.toString());
        }
      } catch {
        // Bỏ qua lỗi quota
      }
    }
  }

  public addScore(points: number): void {
    this.score += points;
    this.saveHighScore();
    EventBus.emit(GameEvents.SCORE_CHANGED, {
      currentScore: this.score,
      highScore: this.highScore,
    });
  }

  public loseLife(): number {
    this.lives = Math.max(0, this.lives - 1);
    EventBus.emit(GameEvents.PLAYER_HIT, { remainingLives: this.lives });
    if (this.lives === 0) {
      EventBus.emit(GameEvents.PLAYER_DIED);
      EventBus.emit(GameEvents.GAME_OVER);
    }
    return this.lives;
  }

  public updateTimer(deltaSeconds: number): boolean {
    if (this.remainingTime <= 0) return true;
    this.remainingTime -= deltaSeconds;
    if (this.remainingTime <= 0) {
      this.remainingTime = 0;
      EventBus.emit(GameEvents.GAME_OVER);
      return true;
    }
    EventBus.emit(GameEvents.TIMER_TICK, { remainingSeconds: Math.ceil(this.remainingTime) });
    return false;
  }

  public calculateTimeBonus(): number {
    const bonus = Math.floor(this.remainingTime) * 10;
    this.addScore(bonus);
    return bonus;
  }

  public reset(keepScore: boolean = false): void {
    if (!keepScore) {
      this.score = 0;
      this.currentStage = 1;
    }
    this.lives = 3;
    this.remainingTime = 200;
  }

  public getScore(): number {
    return this.score;
  }

  public getHighScore(): number {
    return this.highScore;
  }

  public getLives(): number {
    return this.lives;
  }

  public getRemainingTime(): number {
    return this.remainingTime;
  }

  public getStage(): number {
    return this.currentStage;
  }

  public nextStage(): void {
    this.currentStage++;
    this.remainingTime = 200;
  }
}
