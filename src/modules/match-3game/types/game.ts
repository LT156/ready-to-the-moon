// types/game.ts —— 类型契约（Entity / 接口定义）

/** 单个格子 */
export interface Tile {
  id: number;          // 唯一标识
  icon: string;        // 图案（emoji）
  row: number;         // 行索引
  col: number;         // 列索引
  removed: boolean;    // 是否已消除
}

/** 棋盘：二维数组 */
export type Board = Tile[][];

/** 坐标点 */
export interface Point {
  row: number;
  col: number;
}

/** 连通路径（用于绘制连线动画） */
export interface ConnectPath {
  points: Point[];     // 路径上的转折点（含起止点）
}

/** 游戏状态枚举 */
export type GameStatus = 'idle' | 'playing' | 'won' | 'stuck';

/** 一次消除记录（用于撤销 / 回放） */
export interface Move {
  tileA: Tile;
  tileB: Tile;
  step: number;
}

/** 游戏状态 */
export interface GameState {
  board: Board;
  selected: Tile | null;
  steps: number;       // 已用步数
  remaining: number;   // 剩余格子数
  status: GameStatus;
  startTime: number;   // 开始时间戳
  history: Move[];     // 操作历史
  connectPath: ConnectPath | null; // 当前待绘制的连线
  hint: [Tile, Tile] | null;       // 提示的一对格子
}

/** 游戏配置 */
export interface GameConfig {
  rows: number;
  cols: number;
  icons: string[];
}

/** 连通判断结果 */
export interface ConnectResult {
  connected: boolean;
  path: Point[];
}
