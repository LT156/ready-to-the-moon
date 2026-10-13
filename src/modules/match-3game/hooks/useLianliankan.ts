// useLianliankan.ts —— 游戏核心逻辑 Hook（Service 层）
// 用 useReducer 集中管理状态，保证业务逻辑可预测、可回放。
import { useCallback, useReducer } from 'react'
import type {
  Board,
  GameConfig,
  GameState,
  GameStatus,
  Move,
  Tile,
} from '../types/game'
import {
  DEFAULT_CONFIG,
  countRemaining,
  createBoard,
  findHint,
  hasAnyMove,
  removeTiles,
  shuffleRemaining,
} from '../utils/boardUtils'
import { canConnect } from '../utils/connectUtils'

// ---- Action 定义 ----
type Action =
  | { type: 'CLICK'; tile: Tile }
  | { type: 'CLEAR_CONNECT' }
  | { type: 'CLEAR_HINT' }
  | { type: 'HINT' }
  | { type: 'SHUFFLE' }
  | { type: 'RESTART'; config?: GameConfig }

// ---- 初始状态 ----
function initState(config: GameConfig = DEFAULT_CONFIG): GameState {
  const board = createBoard(config)
  return {
    board,
    selected: null,
    steps: 0,
    remaining: countRemaining(board),
    status: 'idle',
    startTime: 0,
    history: [],
    connectPath: null,
    hint: null,
  }
}

/** 消除后判定下一状态：胜利 / 卡死 / 继续游戏 */
function nextStatus(board: Board): GameStatus {
  const remaining = countRemaining(board)
  if (remaining === 0) return 'won'
  if (!hasAnyMove(board)) return 'stuck'
  return 'playing'
}

// ---- Reducer ----
function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'CLICK': {
      const tile = action.tile
      // 胜利或卡死时禁止通过点击消除
      if (state.status === 'won') return state
      if (tile.removed) return state

      // 第一次选中：进入 playing
      if (!state.selected) {
        return {
          ...state,
          selected: tile,
          status: state.status === 'idle' ? 'playing' : state.status,
          startTime: state.startTime === 0 ? Date.now() : state.startTime,
          hint: null,
        }
      }

      // 再次点击同一格 → 取消选中
      if (state.selected.id === tile.id) {
        return { ...state, selected: null }
      }

      // 图案不同 → 切换选中
      if (state.selected.icon !== tile.icon) {
        return { ...state, selected: tile, hint: null }
      }

      // 图案相同 → 判定连通
      const { connected, path } = canConnect(state.selected, tile, state.board)
      if (!connected) {
        return { ...state, selected: tile }
      }

      // 可连通 → 消除
      const board = removeTiles(state.board, state.selected, tile)
      const move: Move = {
        tileA: state.selected,
        tileB: tile,
        step: state.steps + 1,
      }
      return {
        ...state,
        board,
        selected: null,
        steps: state.steps + 1,
        remaining: state.remaining - 2,
        status: nextStatus(board),
        history: [...state.history, move],
        connectPath: { points: path },
        hint: null,
      }
    }

    case 'CLEAR_CONNECT':
      if (!state.connectPath) return state
      return { ...state, connectPath: null }

    case 'HINT': {
      if (state.status === 'won' || state.status === 'stuck') return state
      const hint = findHint(state.board)
      return { ...state, hint, selected: null }
    }

    case 'CLEAR_HINT':
      if (!state.hint) return state
      return { ...state, hint: null }

    case 'SHUFFLE': {
      if (state.status === 'won') return state
      const board = shuffleRemaining(state.board)
      return {
        ...state,
        board,
        selected: null,
        status: nextStatus(board),
        hint: null,
        connectPath: null,
      }
    }

    case 'RESTART':
      return initState(action.config ?? DEFAULT_CONFIG)

    default:
      return state
  }
}

// ---- Hook ----
export function useLianliankan(config: GameConfig = DEFAULT_CONFIG) {
  const [state, dispatch] = useReducer(reducer, config, initState)

  const onTileClick = useCallback((tile: Tile) => {
    dispatch({ type: 'CLICK', tile })
  }, [])

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' })
  }, [])

  const shuffle = useCallback(() => {
    dispatch({ type: 'SHUFFLE' })
  }, [])

  const hint = useCallback(() => {
    dispatch({ type: 'HINT' })
    // 2 秒后自动清除提示高亮
    window.setTimeout(() => dispatch({ type: 'CLEAR_HINT' }), 2000)
  }, [])

  const clearConnect = useCallback(() => {
    dispatch({ type: 'CLEAR_CONNECT' })
  }, [])

  return { state, onTileClick, restart, shuffle, hint, clearConnect }
}
