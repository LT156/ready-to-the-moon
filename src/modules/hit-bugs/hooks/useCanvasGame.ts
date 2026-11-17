import { useEffect, useRef, useCallback } from 'react'
import { GameState } from '../constants'
import { GameEngine } from '../GameEngine'
import { RenderUtils } from '../utils/Render'
import { FlyUtils } from '../utils/Fly'
import { GameEngineUtils } from '../utils/GameEngine'
import { CONFIG } from '../constants'
import type { FloatingText } from '../types/game'

interface CanvasGameOptions {
  width?: number
  height?: number
  dpr?: number
}

export function useCanvasGame(canvasRef: React.RefObject<HTMLCanvasElement>, options: CanvasGameOptions = {}) {
  const gameEngineRef = useRef<GameEngine | null>(null)
  const lastTimeRef = useRef(0)
  const animationFrameRef = useRef(0)

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(options.dpr || window.devicePixelRatio || 1, 2)
    const width = options.width || window.innerWidth
    const height = options.height || window.innerHeight

    canvas.width = width * dpr
    canvas.height = height * dpr
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }, [canvasRef, options])

  const handlePointerDown = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas || !gameEngineRef.current) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const x = clientX - rect.left
    const y = clientY - rect.top

    const engine = gameEngineRef.current
    const state = engine.getState()

    if (state.status !== GameState.PLAYING) return

    // 检查是否命中苍蝇
    let hitFly = false
    for (let i = state.flies.length - 1; i >= 0; i--) {
      const fly = state.flies[i]
      if (FlyUtils.isHit(fly, x, y)) {
        engine.handleHit(fly)
        hitFly = true
        break
      }
    }

    if (!hitFly) {
      // 打空了
      engine.handleMiss(x, y)
    }
  }, [canvasRef])

  const update = useCallback((deltaTime: number) => {
    if (!gameEngineRef.current) return

    gameEngineRef.current.update(deltaTime)
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameEngineRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = gameEngineRef.current.getState()

    ctx.save()

    // 屏幕震动
    if (state.shake > 0.5) {
      ctx.translate(
        (Math.random() - 0.5) * state.shake,
        (Math.random() - 0.5) * state.shake
      )
    }

    // 渲染背景
    RenderUtils.renderBackground(ctx, window.innerWidth, window.innerHeight)

    // 渲染角色
    RenderUtils.renderCharacters(ctx, state.status, state.timer, window.innerWidth, window.innerHeight)

    // 渲染苍蝇
    RenderUtils.renderFlies(ctx, state.flies)

    // 渲染手雷
    if (state.bomb && state.status === GameState.BOMB) {
      RenderUtils.renderBomb(ctx, state.bomb)
    }

    // 渲染粒子
    RenderUtils.renderParticles(ctx, state.particles)

    // 渲染浮动文字
    RenderUtils.renderFloatingTexts(ctx, state.texts)

    // 渲染幕布
    RenderUtils.renderCurtain(ctx, state.curtainY, window.innerHeight)

    ctx.restore()
  }, [canvasRef])

  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.05)
    lastTimeRef.current = currentTime

    update(deltaTime)
    render()

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [update, render])

  // 初始化
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 创建游戏引擎
    gameEngineRef.current = new GameEngine()
    resize()

    window.addEventListener('resize', resize)

    // 支持鼠标和触摸事件
    const handleMouseDown = (e: MouseEvent) => handlePointerDown(e)
    const handleTouchStart = (e: TouchEvent) => handlePointerDown(e)

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })

    // 开始游戏循环
    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('touchstart', handleTouchStart)
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [resize, handlePointerDown, gameLoop])

  return {
    engine: gameEngineRef.current,
    resize,
  }
}