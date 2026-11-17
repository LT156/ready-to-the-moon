import { useState, useCallback } from 'react'
import { GameState } from '../constants'
import type { GameData } from '../types/game'
import { CONFIG } from '../constants'

export function useHitBugs() {
  const [state, setState] = useState<GameData>({
    status: GameState.IDLE,
    timer: 0,
    score: 0,
    hits: 0,
    missCount: 0,
    combo: 0,
    difficulty: 0,
    flies: [],
    particles: [],
    texts: [],
    spawnTimer: 0,
    shake: 0,
    curtainY: -1,
    bomb: null,
    isNewHigh: false,
  })

  const updateScore = useCallback((newScore: number) => {
    setState(prev => ({ ...prev, score: newScore }))
  }, [])

  const updateHits = useCallback((newHits: number) => {
    setState(prev => ({ ...prev, hits: newHits }))
  }, [])

  const updateMissCount = useCallback((newMissCount: number) => {
    setState(prev => ({ ...prev, missCount: newMissCount }))
  }, [])

  const updateCombo = useCallback((newCombo: number) => {
    setState(prev => ({ ...prev, combo: newCombo }))
  }, [])

  const updateDifficulty = useCallback((newDifficulty: number) => {
    setState(prev => ({ ...prev, difficulty: newDifficulty }))
  }, [])

  const addFly = useCallback((fly: any) => {
    setState(prev => ({ ...prev, flies: [...prev.flies, fly] }))
  }, [])

  const removeFly = useCallback((flyId: string) => {
    setState(prev => ({ ...prev, flies: prev.flies.filter(f => f.id !== flyId) }))
  }, [])

  const addParticle = useCallback((particle: any) => {
    setState(prev => ({ ...prev, particles: [...prev.particles, particle] }))
  }, [])

  const addText = useCallback((text: any) => {
    setState(prev => ({ ...prev, texts: [...prev.texts, text] }))
  }, [])

  const setBomb = useCallback((bomb: any) => {
    setState(prev => ({ ...prev, bomb }))
  }, [])

  const resetGame = useCallback(() => {
    setState({
      status: GameState.IDLE,
      timer: 0,
      score: 0,
      hits: 0,
      missCount: 0,
      combo: 0,
      difficulty: 0,
      flies: [],
      particles: [],
      texts: [],
      spawnTimer: 0,
      shake: 0,
      curtainY: -1,
      bomb: null,
      isNewHigh: false,
    })
  }, [])

  const updateGameState = useCallback((newState: GameState) => {
    setState(prev => ({
      ...prev,
      status: newState,
      timer: 0,
      ...(newState === GameState.CURTAIN && { curtainY: -1 }),
      ...(newState === GameState.RESULT && {
        isNewHigh: state.score > (Number(localStorage.getItem(CONFIG.HIGH_SCORE_KEY) || 0))
      })
    }))
  }, [state.score])

  return {
    state,
    setState,
    updateScore,
    updateHits,
    updateMissCount,
    updateCombo,
    updateDifficulty,
    addFly,
    removeFly,
    addParticle,
    addText,
    setBomb,
    resetGame,
    updateGameState,
  }
}