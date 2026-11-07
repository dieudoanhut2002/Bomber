/**
 * Danh mục khóa tài nguyên (Asset Keys) cho Textures, Audio, Animations
 */
export const AssetKeys = {
  // Hình ảnh & Spritesheets
  TEXTURE_TILES: 'tileset_retro',
  TEXTURE_PLAYER: 'player_bomber',
  TEXTURE_BOMB: 'bomb_ticking',
  TEXTURE_EXPLOSION: 'explosion_blast',
  TEXTURE_ENEMY_BALLOM: 'enemy_ballom',
  TEXTURE_ENEMY_ONEAL: 'enemy_oneal',
  TEXTURE_ITEMS: 'powerup_items',
  TEXTURE_DOOR: 'exit_door',

  // Âm thanh (SFX)
  SFX_BOMB_DROP: 'sfx_bomb_drop',
  SFX_EXPLOSION: 'sfx_explosion',
  SFX_POWERUP: 'sfx_powerup',
  SFX_PLAYER_DIE: 'sfx_player_die',
  SFX_ENEMY_DIE: 'sfx_enemy_die',
  SFX_STAGE_CLEAR: 'sfx_stage_clear',
  BGM_STAGE: 'bgm_stage_theme',
} as const;
