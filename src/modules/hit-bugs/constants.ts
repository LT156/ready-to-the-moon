// 游戏状态枚举
export const GameState = {
  IDLE: 'idle',
  TRANSFORM: 'transform',
  PLAYING: 'playing',
  FAIL_CRY: 'failCry',
  BOMB: 'bomb',
  HUG: 'hug',
  CURTAIN: 'curtain',
  RESULT: 'result',
} as const;

// 苍蝇类型配置
export const FLY_TYPES = {
  normal: {
    score: 10,
    radius: 26,
    speed: 90,
    color: '#3a3a3a',
    emoji: '🪰'
  },
  gold: {
    score: 50,
    radius: 22,
    speed: 150,
    color: '#ffd700',
    emoji: '✨'
  },
} as const;

// 游戏配置
export const CONFIG = {
  MAX_MISS: 10,
  HIGH_SCORE_KEY: 'fly_game_high_score',
  MAX_PARTICLES: 300,
  MAX_FLIES: 25,
} as const;

// 动画时长
export const ANIMATION_DURATIONS = {
  TRANSFORM: 1.5,
  BOMB_THROW: 0.9,
  BOMB_EXPLODE_DELAY: 0.1,
  HUG_DURATION: 2,
  CURTAIN_DURATION: 1.4,
} as const;