import type { Fly, FlyType } from '../types/game'
import { FLY_TYPES } from '../constants'

export class FlyUtils {
  /**
   * 创建苍蝇
   */
  static create(W: number, H: number, difficulty: number): Fly {
    const isGold = Math.random() < Math.min(0.08 + difficulty * 0.02, 0.3)
    const t = isGold ? FLY_TYPES.gold : FLY_TYPES.normal

    const edge = Math.floor(Math.random() * 4)
    let x, y
    if (edge === 0) { x = Math.random() * W; y = -30 }
    else if (edge === 1) { x = W + 30; y = Math.random() * H }
    else if (edge === 2) { x = Math.random() * W; y = H + 30 }
    else { x = -30; y = Math.random() * H }

    const speed = t.speed + difficulty * 15
    const angle = Math.atan2(H / 2 - y, W / 2 - x) + (Math.random() - 0.5) * 1.4

    return {
      id: Date.now() + Math.random(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: t.radius,
      type: isGold ? FlyType.GOLD : FlyType.NORMAL,
      score: t.score,
      color: t.color,
      emoji: t.emoji,
      wobblePhase: Math.random() * Math.PI * 2,
      alive: true,
      flashTimer: 1 + Math.random() * 1.5,
      opacity: 1,
    }
  }

  /**
   * 更新苍蝇位置
   */
  static update(fly: Fly, dt: number, W: number, H: number): void {
    if (!fly.alive) return

    fly.wobblePhase += dt * 8

    // 金苍蝇随机闪现
    if (fly.type === FlyType.GOLD) {
      fly.flashTimer -= dt
      if (fly.flashTimer <= 0) {
        fly.flashTimer = 1 + Math.random() * 1.5
        fly.x += (Math.random() - 0.5) * 160
        fly.y += (Math.random() - 0.5) * 160
        fly.opacity = 0.2
      }
      fly.opacity += (1 - fly.opacity) * Math.min(dt * 8, 1)
    }

    const wobble = Math.sin(fly.wobblePhase) * 30
    fly.x += (fly.vx + wobble * 0.3) * dt
    fly.y += (fly.vy + Math.cos(fly.wobblePhase) * 20) * dt

    // 出界即移除
    if (fly.x < -80 || fly.x > W + 80 || fly.y < -80 || fly.y > H + 80) {
      fly.alive = false
    }
  }

  /**
   * 检查苍蝇是否被点击命中
   */
  static isHit(fly: Fly, x: number, y: number): boolean {
    const dx = x - fly.x
    const dy = y - fly.y
    const hitR = fly.radius + 10 // 手感放宽
    return dx * dx + dy * dy <= hitR * hitR
  }
}