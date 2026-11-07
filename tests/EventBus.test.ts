import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';
import { GameEvents } from '@/core/GameEvents';

describe('TypedEventBus (Kiểm tra Type-Safe và Vòng đời Cleanup)', () => {
  it('UT-EVENT-01: Bắn sự kiện và nhận payload đúng kiểu dữ liệu', () => {
    const callback = vi.fn();
    EventBus.on(GameEvents.SCORE_CHANGED, callback);

    EventBus.emit(GameEvents.SCORE_CHANGED, { currentScore: 100, highScore: 500 });
    expect(callback).toHaveBeenCalledWith({ currentScore: 100, highScore: 500 });

    EventBus.off(GameEvents.SCORE_CHANGED, callback);
  });

  it('UT-EVENT-02: Lắng nghe sự kiện không có payload (void event)', () => {
    const callback = vi.fn();
    EventBus.on(GameEvents.GAME_OVER, callback);

    EventBus.emit(GameEvents.GAME_OVER);
    expect(callback).toHaveBeenCalledTimes(1);

    EventBus.off(GameEvents.GAME_OVER, callback);
  });

  it('UT-EVENT-03: Lắng nghe một lần duy nhất với once()', () => {
    const callback = vi.fn();
    EventBus.once(GameEvents.STAGE_CLEARED, callback);

    EventBus.emit(GameEvents.STAGE_CLEARED, { stage: 1, finalScore: 1200 });
    EventBus.emit(GameEvents.STAGE_CLEARED, { stage: 2, finalScore: 2500 });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ stage: 1, finalScore: 1200 });
  });

  it('UT-EVENT-04: Tự động hủy đăng ký khi Scene kích hoạt sự kiện SHUTDOWN (Tránh Memory Leak)', () => {
    const callback = vi.fn();

    // Giả lập một mock Scene của Phaser với EventEmitter riêng
    const mockSceneEvents = new (class {
      private handlers: Record<string, Function[]> = {};
      public once(event: string, fn: Function) {
        if (!this.handlers[event]) this.handlers[event] = [];
        this.handlers[event].push(fn);
      }
      public trigger(event: string) {
        if (this.handlers[event]) {
          this.handlers[event].forEach((fn) => fn());
          delete this.handlers[event];
        }
      }
    })();

    const mockScene = {
      events: mockSceneEvents,
    } as unknown as Phaser.Scene;

    // Đăng ký qua hàm an toàn listen()
    EventBus.listen(mockScene, GameEvents.PLAYER_HIT, callback);

    // Bắn sự kiện lần 1 -> callback phải chạy
    EventBus.emit(GameEvents.PLAYER_HIT, { remainingLives: 2 });
    expect(callback).toHaveBeenCalledTimes(1);

    // Giả lập Scene bị SHUTDOWN (ví dụ khi restart màn chơi)
    mockSceneEvents.trigger('shutdown');

    // Bắn sự kiện lần 2 -> callback KHÔNG ĐƯỢC chạy tiếp
    EventBus.emit(GameEvents.PLAYER_HIT, { remainingLives: 1 });
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
