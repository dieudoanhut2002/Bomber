/**
 * Bộ sinh số giả ngẫu nhiên có thể tái lập (Deterministic Pseudo-Random Number Generator)
 * Sử dụng thuật toán Mulberry32 kết hợp hàm băm FNV-1a để hỗ trợ cả số và chuỗi seed.
 */
export class PRNG {
  private state: number;

  constructor(seed: number | string = Date.now()) {
    if (typeof seed === 'string') {
      this.state = this.hashString(seed);
    } else {
      this.state = seed >>> 0;
    }
  }

  /**
   * Chuyển đổi chuỗi ký tự thành số nguyên 32-bit không dấu bằng FNV-1a hash
   */
  private hashString(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  /**
   * Sinh số thực giả ngẫu nhiên trong khoảng [0, 1) bằng thuật toán Mulberry32
   */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Sinh số nguyên trong khoảng [min, max] (bao gồm cả min và max)
   */
  public nextInt(min: number, max: number): number {
    const floorMin = Math.ceil(min);
    const floorMax = Math.floor(max);
    return Math.floor(this.next() * (floorMax - floorMin + 1)) + floorMin;
  }

  /**
   * Xáo trộn mảng theo thuật toán Fisher-Yates sử dụng seed của PRNG
   * Trả về mảng mới, không làm biến đổi mảng gốc.
   */
  public shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }
}
