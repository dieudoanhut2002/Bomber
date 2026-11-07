import { EventKey, EventCallback, IEventPayloadMap } from '@/types/Event.types';

interface IEventListenerRecord {
  fn: Function;
  context?: unknown;
  once: boolean;
}

/**
 * Interface mô tả đối tượng Scene hoặc đối tượng có quản lý vòng đời sự kiện
 */
export interface ILifecycleEventEmitter {
  events: {
    once(event: string, fn: () => void): void;
  };
}

/**
 * Lớp TypedEventBus độc lập, hiệu năng cao, Type-Safe 100%:
 * 1. Ràng buộc chặt chẽ tên sự kiện với kiểu dữ liệu payload (F-01).
 * 2. Tự động liên kết vòng đời Scene để giải phóng listener khi Scene SHUTDOWN, triệt tiêu memory leak (F-02).
 * 3. Hoàn toàn thuần logic TypeScript, không phụ thuộc navigator/DOM, chạy Headless siêu tốc trong Vitest.
 */
export class TypedEventBus {
  private readonly listeners: Map<EventKey, IEventListenerRecord[]> = new Map();

  /**
   * Đăng ký lắng nghe sự kiện với kiểm tra kiểu chặt chẽ
   */
  public on<K extends EventKey>(event: K, fn: EventCallback<K>, context?: unknown): this {
    return this.addListener(event, fn, context, false);
  }

  /**
   * Đăng ký lắng nghe sự kiện một lần duy nhất
   */
  public once<K extends EventKey>(event: K, fn: EventCallback<K>, context?: unknown): this {
    return this.addListener(event, fn, context, true);
  }

  private addListener<K extends EventKey>(
    event: K,
    fn: EventCallback<K>,
    context: unknown,
    once: boolean
  ): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push({ fn, context, once });
    return this;
  }

  /**
   * Hủy đăng ký lắng nghe sự kiện
   */
  public off<K extends EventKey>(event: K, fn?: EventCallback<K>, context?: unknown): this {
    const records = this.listeners.get(event);
    if (!records) return this;

    if (!fn) {
      this.listeners.delete(event);
      return this;
    }

    const filtered = records.filter((r) => {
      const matchFn = r.fn === fn;
      const matchContext = context === undefined || r.context === context;
      return !(matchFn && matchContext);
    });

    if (filtered.length > 0) {
      this.listeners.set(event, filtered);
    } else {
      this.listeners.delete(event);
    }

    return this;
  }

  /**
   * Bắn sự kiện với payload được kiểm tra type safety nghiêm ngặt
   */
  public emit<K extends EventKey>(
    ...args: IEventPayloadMap[K] extends void ? [event: K] : [event: K, payload: IEventPayloadMap[K]]
  ): boolean {
    const event = args[0] as K;
    const payload = args[1];

    const records = this.listeners.get(event);
    if (!records || records.length === 0) return false;

    // Sao chép mảng để tránh lỗi khi callback tự gỡ listener trong lúc duyệt
    const currentRecords = [...records];

    for (const record of currentRecords) {
      if (record.once) {
        this.off(event, record.fn as EventCallback<K>, record.context);
      }
      record.fn.call(record.context, payload);
    }

    return true;
  }

  /**
   * Đăng ký lắng nghe sự kiện AN TOÀN gắn liền với vòng đời của Scene (F-02)
   * Tự động hủy đăng ký khi Scene kích hoạt sự kiện SHUTDOWN hoặc DESTROY.
   */
  public listen<K extends EventKey>(
    scene: ILifecycleEventEmitter,
    event: K,
    fn: EventCallback<K>,
    context?: unknown
  ): void {
    this.on(event, fn, context);

    // Tự động hook vào sự kiện SHUTDOWN của Scene để cleanup triệt để
    scene.events.once('shutdown', () => {
      this.off(event, fn, context);
    });

    // Phòng ngừa trường hợp Scene bị destroy trực tiếp
    scene.events.once('destroy', () => {
      this.off(event, fn, context);
    });
  }

  /**
   * Xóa toàn bộ listeners (dùng cho teardown hoặc testing)
   */
  public removeAllListeners(event?: EventKey): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
}

/**
 * Singleton instance toàn cục của TypedEventBus
 */
export const EventBus = new TypedEventBus();
