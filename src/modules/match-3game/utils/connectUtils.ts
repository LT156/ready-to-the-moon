// connectUtils.ts —— 连通性判断算法（工具类 / 算法层）
//
// 采用“带边界的扩展坐标系”：棋盘外围一圈虚拟空格。
// isEmpty 对棋盘范围外的坐标返回 true，从而天然支持从棋盘边缘连出的路径，
// 无需额外维护扩展数组。
import type { Board, ConnectResult, Point, Tile } from '../types/game'

/** 判断某格是否“可通行”（空）——棋盘外围一圈视为空，棋盘内则看 removed */
export function isEmpty(r: number, c: number, board: Board): boolean {
  const rows = board.length
  const cols = rows > 0 ? board[0].length : 0
  if (r < 0 || r >= rows || c < 0 || c >= cols) return true // 外围虚拟空格
  return board[r][c].removed
}

/**
 * 直线连通判断：r1/c1 与 r2/c2 必须同行或同列，
 * 起止点本身不检查，只检查中间是否全部为空。
 */
export function isLineClear(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  board: Board,
): boolean {
  if (r1 === r2) {
    const min = Math.min(c1, c2)
    const max = Math.max(c1, c2)
    for (let c = min + 1; c < max; c++) {
      if (!isEmpty(r1, c, board)) return false
    }
    return true
  }
  if (c1 === c2) {
    const min = Math.min(r1, r2)
    const max = Math.max(r1, r2)
    for (let r = min + 1; r < max; r++) {
      if (!isEmpty(r, c1, board)) return false
    }
    return true
  }
  return false
}

/** 从一个 Point 到目标 Tile 的 ≤1 折点连通，返回路径（起点为 p） */
function connectWithOneTurn(p: Point, b: Tile, board: Board): ConnectResult {
  const target: Point = { row: b.row, col: b.col }

  // 0 折点：直线
  if (isLineClear(p.row, p.col, target.row, target.col, board)) {
    return { connected: true, path: [p, target] }
  }

  // 1 折点：两个候选折点
  const corners: Point[] = [
    { row: p.row, col: b.col },
    { row: b.row, col: p.col },
  ]
  for (const cor of corners) {
    if (
      isEmpty(cor.row, cor.col, board) &&
      isLineClear(p.row, p.col, cor.row, cor.col, board) &&
      isLineClear(cor.row, cor.col, target.row, target.col, board)
    ) {
      return { connected: true, path: [p, cor, target] }
    }
  }
  return { connected: false, path: [] }
}

/**
 * 连通性判断主入口：两个格子 A、B 是否可连通，并返回路径点集。
 * 算法流程：
 *   1. 图案不同 / 同一格 → false
 *   2. 直线连通（0 折点）
 *   3. 单折点连通（两个候选折点）
 *   4. 双折点连通：第一个折点必与 A 同行或同列，扫描该行/列所有空格（含外围）
 */
export function canConnect(a: Tile, b: Tile, board: Board): ConnectResult {
  if (a.icon !== b.icon) return { connected: false, path: [] }
  if (a.row === b.row && a.col === b.col) return { connected: false, path: [] }

  const rows = board.length
  const cols = rows > 0 ? board[0].length : 0
  const A: Point = { row: a.row, col: a.col }
  const B: Point = { row: b.row, col: b.col }

  // 2. 直线连通
  if (isLineClear(A.row, A.col, B.row, B.col, board)) {
    return { connected: true, path: [A, B] }
  }

  // 3. 单折点连通
  const corners: Point[] = [
    { row: a.row, col: b.col },
    { row: b.row, col: a.col },
  ]
  for (const cor of corners) {
    if (
      isEmpty(cor.row, cor.col, board) &&
      isLineClear(A.row, A.col, cor.row, cor.col, board) &&
      isLineClear(cor.row, cor.col, B.row, B.col, board)
    ) {
      return { connected: true, path: [A, cor, B] }
    }
  }

  // 4. 双折点连通：扫描与 A 同行 / 同列的所有空格（含外围一圈）作为第一折点 p
  //    沿 A 所在行
  for (let c = -1; c <= cols; c++) {
    if (c === a.col) continue
    const p: Point = { row: a.row, col: c }
    if (!isEmpty(p.row, p.col, board)) continue
    if (!isLineClear(A.row, A.col, p.row, p.col, board)) continue
    const sub = connectWithOneTurn(p, b, board)
    if (sub.connected) {
      // sub.path 以 p 开头，拼接 A + sub.path[1..]
      return { connected: true, path: [A, ...sub.path.slice(1)] }
    }
  }
  //    沿 A 所在列
  for (let r = -1; r <= rows; r++) {
    if (r === a.row) continue
    const p: Point = { row: r, col: a.col }
    if (!isEmpty(p.row, p.col, board)) continue
    if (!isLineClear(A.row, A.col, p.row, p.col, board)) continue
    const sub = connectWithOneTurn(p, b, board)
    if (sub.connected) {
      return { connected: true, path: [A, ...sub.path.slice(1)] }
    }
  }

  return { connected: false, path: [] }
}
