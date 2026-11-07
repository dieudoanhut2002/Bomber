import Phaser from 'phaser';
import { gameConfig } from '@/config/GameConfig';

/**
 * Điểm khởi chạy chính của ứng dụng Bomber Game
 */
window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(gameConfig);
});
