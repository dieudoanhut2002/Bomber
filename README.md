# BOMBER GAME (PHASER 3 + TYPESCRIPT)

> Dự án game Bomber cổ điển chạy trên trình duyệt web, được kiến trúc theo chuẩn mực chuyên nghiệp, mô-đun hóa cao, type-safe và sẵn sàng cho việc triển khai tự động bằng AI Coding Agents.

---

## 🎮 Tổng Quan Dự Án

**Bomber Game** tái hiện trải nghiệm kinh điển của dòng game đặt bom (Bomberman) huyền thoại thập niên 90 với công nghệ web hiện đại:
- **Khung nhìn**: Top-down 2D grid-based.
- **Lối chơi cốt lõi**: Điều khiển nhân vật di chuyển qua mê cung, đặt bom phá hủy chướng ngại vật mềm (Soft Blocks), săn tìm vật phẩm bổ trợ (Power-ups), tiêu diệt quái vật (Enemies) và tìm cửa thoát hiểm (Exit Door) trước khi hết giờ.
- **Nền tảng mục tiêu**: Trình duyệt Web (ưu tiên Desktop với bàn phím, kiến trúc sẵn sàng mở rộng cho Mobile Touch).
- **Mô hình hoạt động**: 100% Client-side (Offline-first, không yêu cầu máy chủ backend trong giai đoạn MVP).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ lựa chọn | Phiên bản / Ghi chú |
| :--- | :--- | :--- |
| **Game Engine** | [Phaser 3](https://phaser.io/) | v3.80+ (Stable, WebGL/Canvas 2D) |
| **Ngôn ngữ** | [TypeScript](https://www.typescriptlang.org/) | v5.x (Strict mode, Type-safe tuyệt đối) |
| **Bundler & Dev Server** | [Vite](https://vitejs.dev/) | v5.x (HMR siêu tốc, tối ưu hóa bundle) |
| **Quản lý gói** | npm | v10.x |
| **Kiểm thử tự động** | [Vitest](https://vitest.dev/) | Kiểm thử đơn vị cho logic Grid, Bomb & Blast |
| **CI/CD** | GitHub Actions | Tự động hóa build, test và phát hành |
| **Hosting & Deploy** | GitHub Pages | Lưu trữ tĩnh hoàn toàn miễn phí, hiệu năng cao |

---

## 📁 Cấu Trúc Dự Án

```text
G:/GIT/Bomber/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD tự động deploy lên GitHub Pages
├── Agents/                       # TÀI LIỆU QUẢN TRỊ DÀNH CHO AI VÀ KỸ SƯ
│   ├── PRODUCT_REQUIREMENTS.md   # Đặc tả yêu cầu sản phẩm & phạm vi MVP
│   ├── GAME_DESIGN_DOCUMENT.md   # Thiết kế chi tiết cơ chế game (GDD)
│   ├── ARCHITECTURE.md           # Kiến trúc phần mềm, sơ đồ mô-đun & luồng dữ liệu
│   ├── IMPLEMENTATION_ROADMAP.md # Lộ trình thực hiện chi tiết từng Stage
│   ├── TEST_STRATEGY.md          # Chiến lược kiểm thử tự động & thủ công
│   └── DECISION_LOG.md           # Nhật ký các quyết định kiến trúc (ADR)
├── public/                       # Tài nguyên tĩnh (sprites, âm thanh, tilesets)
│   └── assets/
│       ├── images/
│       ├── audio/
│       └── maps/
├── src/                          # Mã nguồn chính của game (bắt đầu từ Stage 1)
│   ├── config/                   # Hằng số cấu hình, thông số cân bằng game
│   ├── core/                     # EventBus, StateMachine, hằng số toàn cục
│   ├── entities/                 # Thực thể: Player, Bomb, Explosion, Enemy, PowerUp
│   ├── systems/                  # Hệ thống logic: Grid, Bomb, Collision, AI, Score
│   ├── scenes/                   # Các màn hình Phaser (Boot, Menu, Game, UI, GameOver)
│   ├── ui/                       # Giao diện HUD, bảng điểm, màn hình tạm dừng
│   ├── utils/                    # Tiện ích chuyển đổi tọa độ, toán học
│   └── main.ts                   # Điểm khởi chạy game (Game Entry Point)
├── GEMINI.md                     # Hướng dẫn và quy tắc ứng xử dành riêng cho AI Agent
├── index.html                    # Trang HTML chính chứa Canvas
├── package.json                  # Cấu hình phụ thuộc và scripts
├── tsconfig.json                 # Cấu hình TypeScript Strict
├── vite.config.ts                # Cấu hình Vite bundler
└── README.md                     # Tài liệu tổng quan dự án
```

---

## 📋 Tài Liệu Quản Trị & Thiết Kế (Agent Governance)

Dự án này được thiết kế theo mô hình **Agent-Ready Architecture** – nghĩa là toàn bộ quy tắc, thông số và tiêu chuẩn kỹ thuật được tài liệu hóa chi tiết, cho phép bất kỳ AI Coding Agent nào cũng có thể độc lập tiếp quản dự án:

1. 📖 [Hướng dẫn dành riêng cho AI Agent](file:///G:/GIT/Bomber/GEMINI.md)
2. 🎯 [Yêu cầu sản phẩm (PRD)](file:///G:/GIT/Bomber/Agents/PRODUCT_REQUIREMENTS.md)
3. 🕹️ [Tài liệu thiết kế Game (GDD)](file:///G:/GIT/Bomber/Agents/GAME_DESIGN_DOCUMENT.md)
4. 🏗️ [Kiến trúc hệ thống (Architecture)](file:///G:/GIT/Bomber/Agents/ARCHITECTURE.md)
5. 🗺️ [Lộ trình triển khai (Roadmap)](file:///G:/GIT/Bomber/Agents/IMPLEMENTATION_ROADMAP.md)
6. 🧪 [Chiến lược kiểm thử (Test Strategy)](file:///G:/GIT/Bomber/Agents/TEST_STRATEGY.md)
7. 📝 [Nhật ký quyết định kỹ thuật (ADR)](file:///G:/GIT/Bomber/Agents/DECISION_LOG.md)

---

## 🚦 Quy Trình Phê Duyệt Từng Giai Đoạn (Approval Gates)

Mỗi giai đoạn phát triển tuân thủ nghiêm ngặt **Cổng kiểm duyệt (Approval Gate)**:
- **Stage 0**: Phân tích, thiết kế kiến trúc và chuẩn bị tài liệu (Hoàn tất & chờ phê duyệt).
- **Stage 1**: Khởi tạo hạ tầng dự án (Scaffolding, Vite, TS, Phaser, CI/CD).
- **Stage 2**: Lưới bản đồ (Grid System), Render Tilemap và Di chuyển Player mượt mà.
- **Stage 3**: Hệ thống Đặt Bom, Đếm ngược nổ và Lan truyền vụ nổ (Blast Propagation).
- **Stage 4**: Hệ thống Vật phẩm bổ trợ (Power-ups) và Cổng thoát hiểm bí mật.
- **Stage 5**: Thực thể Quái vật (Enemies) và Trí tuệ nhân tạo (AI Systems).
- **Stage 6**: Vòng lặp trò chơi (Game Loop), Giao diện HUD, Tính điểm, Thắng/Thua.
- **Stage 7**: Âm thanh, Hiệu ứng hình ảnh (VFX), Hệ thống nhiều màn chơi và Polish.
- **Stage 8**: Đảm bảo chất lượng (QA), Kiểm thử toàn diện và Phát hành GitHub Pages.

> **Quy tắc vàng**: AI Agent KHÔNG được tự ý triển khai code cho Stage tiếp theo khi chưa nhận được xác nhận nghiệm thu và đồng ý từ Tech Lead / User.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Dành cho Stage 1 trở đi)

Sau khi Stage 0 được phê duyệt và mã nguồn được khởi tạo ở Stage 1:

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển (Development Server)
npm run dev

# 3. Kiểm tra kiểu dữ liệu và chạy linter
npm run typecheck
npm run lint

# 4. Chạy kiểm thử tự động (Unit Tests)
npm run test

# 5. Build sản phẩm sẵn sàng triển khai (Production Build)
npm run build

# 6. Xem thử bản build cục bộ
npm run preview
```

---

## 📜 Giấy Phép & Bản Quyền

Dự án phát triển cho mục đích học tập, nghiên cứu và giải trí. Bản quyền thiết kế thuộc về đội ngũ phát triển Bomber Web Project.
