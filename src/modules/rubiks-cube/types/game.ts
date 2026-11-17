// types/game.ts —— 3D魔方类型定义

/** 魔方面标识 */
export type Face = 'U' | 'D' | 'R' | 'L' | 'F' | 'B'

/** 旋转方向：cw=顺时针, ccw=逆时针 */
export type Direction = 'cw' | 'ccw'

/** 一次旋转操作 */
export interface Move {
  face: Face
  direction: Direction
}

/** 旋转轴 */
export type Axis = 'x' | 'y' | 'z'

/** 小立方体在网格中的坐标（-1, 0, 1） */
export interface CubePosition {
  x: number
  y: number
  z: number
}

/** 面→轴+层+方向映射 */
export interface FaceConfig {
  axis: Axis
  layer: number    // 1 或 -1
  cwAngle: number  // 顺时针旋转角度（弧度）
}

/** 游戏状态 */
export interface GameState {
  status: 'idle' | 'scrambling' | 'playing' | 'won'
  moves: number        // 玩家操作步数
  scrambleMoves: number // 打乱步数
  startTime: number     // 开始时间戳
  moveHistory: Move[]   // 操作历史
}

/** 面颜色方案（标准六色） */
export const FACE_COLORS: Record<Face, string> = {
  U: '#ffffff', // 白 - 上
  D: '#ffff00', // 黄 - 下
  R: '#ff0000', // 红 - 右
  L: '#ff8c00', // 橙 - 左
  F: '#0000ff', // 蓝 - 前
  B: '#00ff00', // 绿 - 后
}

/** 面→轴/层/方向映射表（文档 §4.4） */
export const FACE_CONFIG: Record<Face, FaceConfig> = {
  U: { axis: 'y', layer: 1, cwAngle: -Math.PI / 2 },
  D: { axis: 'y', layer: -1, cwAngle: Math.PI / 2 },
  R: { axis: 'x', layer: 1, cwAngle: -Math.PI / 2 },
  L: { axis: 'x', layer: -1, cwAngle: Math.PI / 2 },
  F: { axis: 'z', layer: 1, cwAngle: -Math.PI / 2 },
  B: { axis: 'z', layer: -1, cwAngle: Math.PI / 2 },
}
