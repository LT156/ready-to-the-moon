// 游戏状态枚举 (从 constants 导入)
import { GameState } from '../constants'

// 苍蝇类型
export enum FlyType {
  NORMAL = 'normal',
  GOLD = 'gold',
}

// 苍蝇接口
export interface Fly {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: FlyType;
  score: number;
  color: string;
  emoji: string;
  wobblePhase: number;
  alive: boolean;
  flashTimer: number;
  opacity: number;
}

// 粒子接口
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// 浮动文字接口
export interface FloatingText {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  vy: number;
}

// 手雷接口
export interface Bomb {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  t: number;
  duration: number;
  exploded: boolean;
}

// 游戏状态数据
export interface GameData {
  status: GameState;
  timer: number;
  score: number;
  hits: number;
  missCount: number;
  combo: number;
  difficulty: number;
  flies: Fly[];
  particles: Particle[];
  texts: FloatingText[];
  spawnTimer: number;
  shake: number;
  curtainY: number;
  bomb: Bomb | null;
  isNewHigh: boolean;
}