import type { Fly, Particle, FloatingText, Bomb } from '../types/game'
import { GameState } from '../constants'
import { FlyUtils } from './Fly'

export class GameEngineUtils {
  /**
   * 检查是否需要生成新苍蝇
   */
  static shouldSpawn(spawnTimer: number, flies: Fly[], maxFlies: number, difficulty: number): boolean {
    if (spawnTimer <= 0 && flies.length < maxFlies) {
      const interval = Math.max(0.35, 1.1 - difficulty * 0.05)
      return spawnTimer <= -interval
    }
    return false
  }

  /**
   * 生成粒子
   */
  static spawnParticles(particles: Particle[], x: number, y: number, color: string, count = 14): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 60 + Math.random() * 200
      particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        color,
        size: 2 + Math.random() * 4,
      })
    }

    // 限制粒子数量
    if (particles.length > 300) {
      particles.splice(0, particles.length - 300)
    }
  }

  /**
   * 生成浮动文字
   */
  static spawnFloatingText(texts: FloatingText[], text: string, x: number, y: number, color: string): void {
    texts.push({
      text,
      x,
      y,
      life: 1.2,
      maxLife: 1.2,
      color,
      vy: -40,
    })
  }

  /**
   * 更新粒子
   */
  static updateParticles(particles: Particle[], dt: number): void {
    for (const p of particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 400 * dt // 重力
      p.vx *= 0.98 // 空气阻力
      p.life -= dt
    }
    particles.filter(p => p.life > 0)
  }

  /**
   * 更新浮动文字
   */
  static updateFloatingTexts(texts: FloatingText[], dt: number): void {
    for (const t of texts) {
      t.y += t.vy * dt
      t.life -= dt
    }
    texts.filter(t => t.life > 0)
  }

  /**
   * 初始化手雷
   */
  static initBomb(W: number, H: number): Bomb {
    return {
      x: W * 0.15,
      y: H * 0.55,
      startX: W * 0.15,
      startY: H * 0.55,
      targetX: W * 0.5,
      targetY: H * 0.4,
      t: 0,
      duration: 0.9,
      exploded: false,
    }
  }

  /**
   * 更新手雷位置
   */
  static updateBomb(bomb: Bomb, dt: number): void {
    bomb.t += dt
    const p = Math.min(bomb.t / bomb.duration, 1)

    // 抛物线运动
    bomb.x = bomb.startX + (bomb.targetX - bomb.startX) * p
    bomb.y = bomb.startY + (bomb.targetY - bomb.startY) * p - Math.sin(p * Math.PI) * 180

    // 检查是否爆炸
    if (p >= 1 && !bomb.exploded) {
      bomb.exploded = true
    }
  }

  /**
   * 检查游戏状态转换
   */
  static checkStateTransition(
    status: GameState,
    timer: number,
    hits: number,
    flies: Fly[],
    missCount: number,
    maxMiss: number,
    setState: (state: GameState) => void
  ): void {
    switch (status) {
      case GameState.IDLE:
        if (timer > 2.5) setState(GameState.TRANSFORM)
        break
      case GameState.TRANSFORM:
        if (timer > 1.5) setState(GameState.PLAYING)
        break
      case GameState.PLAYING:
        if (hits > 0 && flies.length === 0 && timer > 3) {
          setState(GameState.BOMB)
        }
        break
      case GameState.FAIL_CRY:
        if (timer > 2.5) setState(GameState.BOMB)
        break
      case GameState.HUG:
        if (timer > 2) setState(GameState.CURTAIN)
        break
      case GameState.CURTAIN:
        if (timer > 1.4) setState(GameState.RESULT)
        break
    }

    // 打满10次触发哭戏
    if (missCount >= maxMiss && status !== GameState.FAIL_CRY && status !== GameState.BOMB && status !== GameState.RESULT) {
      setState(GameState.FAIL_CRY)
    }
  }

  /**
   * 清除死亡的苍蝇
   */
  static cleanUpFlies(flies: Fly[]): Fly[] {
    return flies.filter(fly => fly.alive)
  }
}