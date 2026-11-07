import Phaser from 'phaser';
import { GAME_DIMENSIONS } from '@/config/GridConfig';
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { GameScene } from '@/scenes/GameScene';

export { GAME_DIMENSIONS };

/**
 * Cấu hình tổng thể khởi tạo Phaser.Game
 */
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_DIMENSIONS.WIDTH,
  height: GAME_DIMENSIONS.HEIGHT,
  backgroundColor: '#111827',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  scene: [BootScene, PreloadScene, GameScene],
};
