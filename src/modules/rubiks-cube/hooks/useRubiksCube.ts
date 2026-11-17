// useRubiksCube.ts —— 魔方游戏状态管理 Hook
import { useCallback, useReducer } from 'react'
import type { Direction, Face, GameState } from '../types/game'

type Action =
  | { type: 'START_SCRAMBLE'; moves: number }
  | { type: 'SCRAMBLE_DONE' }
  | { type: 'ROTATE'; face: Face; direction: Direction }
  | { type: 'WIN' }
  | { type: 'RESET' }

const initialState: GameState = {
  status: 'idle',
  moves: 0,
  scrambleMoves: 0,
  startTime: 0,
  moveHistory: [],
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_SCRAMBLE':
      return {
        ...state,
        status: 'scrambling',
        scrambleMoves: action.moves,
        moves: 0,
        moveHistory: [],
        startTime: 0,
      }
    case 'SCRAMBLE_DONE':
      return {
        ...state,
        status: 'playing',
        startTime: Date.now(),
      }
    case 'ROTATE':
      return {
        ...state,
        moves: state.moves + 1,
        moveHistory: [...state.moveHistory, { face: action.face, direction: action.direction }],
      }
    case 'WIN':
      return { ...state, status: 'won' }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export function useRubiksCube() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const startScramble = useCallback((moves: number) => {
    dispatch({ type: 'START_SCRAMBLE', moves })
  }, [])

  const scrambleDone = useCallback(() => {
    dispatch({ type: 'SCRAMBLE_DONE' })
  }, [])

  const rotate = useCallback((face: Face, direction: Direction) => {
    dispatch({ type: 'ROTATE', face, direction })
  }, [])

  const win = useCallback(() => {
    dispatch({ type: 'WIN' })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return { state, startScramble, scrambleDone, rotate, win, reset }
}
