import { describe, it, expect } from 'vitest';
import { OrthogonalInputResolver } from '@/systems/PlayerInputSystem';

describe('PlayerInputSystem & OrthogonalInputResolver', () => {
  it('UT-INPUT-01: Nhấn Arrow Up / W tạo hướng UP', () => {
    const resolver = new OrthogonalInputResolver();
    resolver.setDirectionState('UP', true);
    expect(resolver.getDirection()).toBe('UP');
  });

  it('UT-INPUT-02: Nhấn Arrow Down / S tạo hướng DOWN', () => {
    const resolver = new OrthogonalInputResolver();
    resolver.setDirectionState('DOWN', true);
    expect(resolver.getDirection()).toBe('DOWN');
  });

  it('UT-INPUT-03: Nhấn Arrow Left / A tạo hướng LEFT', () => {
    const resolver = new OrthogonalInputResolver();
    resolver.setDirectionState('LEFT', true);
    expect(resolver.getDirection()).toBe('LEFT');
  });

  it('UT-INPUT-04: Nhấn Arrow Right / D tạo hướng RIGHT', () => {
    const resolver = new OrthogonalInputResolver();
    resolver.setDirectionState('RIGHT', true);
    expect(resolver.getDirection()).toBe('RIGHT');
  });

  it('UT-INPUT-05: Thả phím khiến hướng trở về NONE', () => {
    const resolver = new OrthogonalInputResolver();
    resolver.setDirectionState('UP', true);
    expect(resolver.getDirection()).toBe('UP');

    resolver.setDirectionState('UP', false);
    expect(resolver.getDirection()).toBe('NONE');
  });

  it('UT-INPUT-06: Nhấn hai lần cùng một hướng không tạo duplicate trong stack', () => {
    const resolver = new OrthogonalInputResolver();
    // Ví dụ người chơi giữ cả ArrowUp và phím W đồng thời
    resolver.setDirectionState('UP', true);
    resolver.setDirectionState('UP', true);
    expect(resolver.getDirection()).toBe('UP');

    // Thả một phím ra
    resolver.setDirectionState('UP', false);
    expect(resolver.getDirection()).toBe('NONE');
  });

  it('UT-INPUT-07: Xử lý hai hướng vuông góc theo cơ chế Last-Pressed Priority', () => {
    const resolver = new OrthogonalInputResolver();

    // 1. Đang giữ phím RIGHT
    resolver.setDirectionState('RIGHT', true);
    expect(resolver.getDirection()).toBe('RIGHT');

    // 2. Nhấn thêm phím UP trong khi vẫn giữ RIGHT -> UP là phím mới nhất, chiếm quyền ưu tiên
    resolver.setDirectionState('UP', true);
    expect(resolver.getDirection()).toBe('UP');

    // 3. Thả phím UP ra -> Quay lại phím RIGHT vẫn đang được giữ
    resolver.setDirectionState('UP', false);
    expect(resolver.getDirection()).toBe('RIGHT');

    // 4. Thả nốt phím RIGHT -> Về NONE
    resolver.setDirectionState('RIGHT', false);
    expect(resolver.getDirection()).toBe('NONE');
  });

  it('UT-INPUT-08: Reset xóa sạch trạng thái phím (ngăn ngừa lưu input sau scene restart)', () => {
    const resolver = new OrthogonalInputResolver();
    resolver.setDirectionState('LEFT', true);
    resolver.setDirectionState('DOWN', true);
    expect(resolver.getDirection()).toBe('DOWN');

    resolver.reset();
    expect(resolver.getDirection()).toBe('NONE');
  });
});
