// boardUtils.ts —— 棋盘数据操作（DAO）：生成、打乱、重排、提示、求解检测
import type { Board, GameConfig, Tile } from '../types/game'
import { canConnect } from './connectUtils'

/** 默认图案库（emoji） */
export const DEFAULT_ICONS: string[] = [
  '🐇', '🌙', '🍷', '🍺', '🍸', '💜', '🌟', '🦋', '☀️', '🍍',
]

/** 默认配置：8 行 × 10 列 = 80 格 */
export const DEFAULT_CONFIG: GameConfig = {
  rows: 8,
  cols: 10,
  icons: DEFAULT_ICONS,
}

/** Fisher–Yates 洗牌（原地打乱） */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * 生成棋盘：
 *  - 总数必须是偶数
 *  - 每种图案数量为偶数（成对出现）
 *  - 生成后若无可消除对则重洗，保证开局有解
 */
export function createBoard(config: GameConfig = DEFAULT_CONFIG): Board {
  const { rows, cols, icons } = config
  const total = rows * cols
  if (total % 2 !== 0) {
    throw new Error(`棋盘格子数必须为偶数，当前为 ${total}`)
  }
  const kinds = icons.length
  if (kinds === 0) throw new Error('至少需要一种图案')

  const pairs = total / 2
  const iconList: string[] = []
  for (let i = 0; i < pairs; i++) {
    const icon = icons[i % kinds]
    iconList.push(icon, icon)
  }

  // 尝试生成有解的初始局面
  for (let attempt = 0; attempt < 50; attempt++) {
    shuffle(iconList)
    const board = buildBoard(rows, cols, iconList)
    if (hasAnyMove(board)) return board
  }
  // 兜底：最后一定返回一个局面
  return buildBoard(rows, cols, iconList)
}

/** 由一维 icon 列表构建二维棋盘（分配 id 与坐标） */
function buildBoard(rows: number, cols: number, iconList: string[]): Board {
  const board: Board = []
  let id = 0
  for (let r = 0; r < rows; r++) {
    const row: Tile[] = []
    for (let c = 0; c < cols; c++) {
      row.push({
        id: id++,
        icon: iconList[r * cols + c],
        row: r,
        col: c,
        removed: false,
      })
    }
    board.push(row)
  }
  return board
}

/** 深拷贝棋盘（每个 Tile 都是独立对象，保证不可变更新） */
export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((t) => ({ ...t })))
}

/** 将两个格子标记为已消除，返回新棋盘 */
export function removeTiles(board: Board, a: Tile, b: Tile): Board {
  const next = cloneBoard(board)
  next[a.row][a.col] = { ...next[a.row][a.col], removed: true }
  next[b.row][b.col] = { ...next[b.row][b.col], removed: true }
  return next
}

/** 统计剩余未消除格子数 */
export function countRemaining(board: Board): number {
  let n = 0
  for (const row of board) for (const t of row) if (!t.removed) n++
  return n
}

/** 收集所有未消除格子 */
export function collectAlive(board: Board): Tile[] {
  const list: Tile[] = []
  for (const row of board) for (const t of row) if (!t.removed) list.push(t)
  return list
}

/** 是否还存在任意一对可消除的格子（用于判断是否卡死 / 开局有解） */
export function hasAnyMove(board: Board): boolean {
  return findHint(board) !== null
}

/**
 * 提示 / 求解：遍历所有同图案格子对，返回第一对可连通的。
 * 复杂度 O(n²) 对数 × 单次连通判断，对 8×10 规模足够。
 */
export function findHint(board: Board): [Tile, Tile] | null {
  const alive = collectAlive(board)
  for (let i = 0; i < alive.length; i++) {
    for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i]
      const b = alive[j]
      if (a.icon !== b.icon) continue
      if (canConnect(a, b, board).connected) return [a, b]
    }
  }
  return null
}

/**
 * 洗牌：收集所有未消除格子的 icon，重新随机分配位置，
 * 重洗后若仍无解则继续重试（上限 50 次），保证洗牌后局面可继续。
 */
export function shuffleRemaining(board: Board): Board {
  const alive = collectAlive(board)
  const iconList = alive.map((t) => t.icon)
  for (let attempt = 0; attempt < 50; attempt++) {
    shuffle(iconList)
    const next = cloneBoard(board)
    alive.forEach((t, idx) => {
      next[t.row][t.col] = { ...next[t.row][t.col], icon: iconList[idx] }
    })
    if (hasAnyMove(next)) return next
  }
  // 兜底
  const next = cloneBoard(board)
  shuffle(iconList)
  alive.forEach((t, idx) => {
    next[t.row][t.col] = { ...next[t.row][t.col], icon: iconList[idx] }
  })
  return next
}
