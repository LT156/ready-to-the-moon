import type { Fly, Particle, FloatingText, Bomb } from '../types/game'
import { FlyUtils } from './Fly'

export class RenderUtils {
  /**
   * 渲染背景
   */
  static renderBackground(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    // 天空渐变
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#87CEEB')
    bg.addColorStop(1, '#B0E0E6')
    ctx.fillStyle = bg
    ctx.fillRect(-50, -50, W + 100, H + 100)

    // 草地
    ctx.fillStyle = '#7CCD7C'
    ctx.fillRect(-50, H * 0.78, W + 100, H * 0.3)
  }

  /**
   * 渲染苍蝇
   */
  static renderFlies(ctx: CanvasRenderingContext2D, flies: Fly[]): void {
    for (const fly of flies) {
      ctx.globalAlpha = fly.opacity
      ctx.font = `${fly.radius * 1.8}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(fly.emoji, fly.x, fly.y)

      // 金苍蝇发光效果
      if (fly.type === 'gold') {
        ctx.shadowColor = '#ffd700'
        ctx.shadowBlur = 20
        ctx.fillText(fly.emoji, fly.x, fly.y)
        ctx.shadowBlur = 0
      }
    }
    ctx.globalAlpha = 1
  }

  /**
   * 渲染手雷
   */
  static renderBomb(ctx: CanvasRenderingContext2D, bomb: Bomb): void {
    ctx.font = '48px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🍹', bomb.x, bomb.y)
  }

  /**
   * 渲染粒子
   */
  static renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(p.life / p.maxLife, 0)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  /**
   * 渲染浮动文字
   */
  static renderFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]): void {
    for (const t of texts) {
      ctx.globalAlpha = Math.min(t.life / t.maxLife, 1)
      ctx.font = 'bold 28px "PingFang SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(0,0,0,.4)'
      ctx.fillText(t.text, t.x + 2, t.y + 2)
      ctx.fillStyle = t.color
      ctx.fillText(t.text, t.x, t.y)
    }
    ctx.globalAlpha = 1
  }

  /**
   * 渲染幕布
   */
  static renderCurtain(ctx: CanvasRenderingContext2D, curtainY: number, H: number): void {
    if (curtainY <= 0) return

    const curtainHeight = Math.min(curtainY, 1) * H
    const gradient = ctx.createLinearGradient(0, 0, 0, curtainHeight)
    gradient.addColorStop(0, '#8B0000')
    gradient.addColorStop(1, '#B22222')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, ctx.canvas.width, curtainHeight)

    // 褶皱效果
    ctx.strokeStyle = 'rgba(0,0,0,.2)'
    ctx.lineWidth = 2
    for (let x = 0; x < ctx.canvas.width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + 20, curtainHeight)
      ctx.stroke()
    }
  }

  /**
   * 渲染角色
   */
  static renderCharacters(
    ctx: CanvasRenderingContext2D,
    status: GameState,
    timer: number,
    W: number,
    H: number
  ): void {
    const groundY = H * 0.82
    const scale = Math.min(W, H) / 800

    // 人（左侧）
    const manX = W * 0.15
    ctx.font = `${140 * scale}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'

    if (status === GameState.IDLE || status === GameState.TRANSFORM) {
      // 人喝饮料
      ctx.fillText('🧑', manX, groundY)

      // 不耐烦的表情
      if (status === GameState.IDLE) {
        ctx.font = `${32 * scale}px serif`
        ctx.fillText('😤', manX + 60 * scale, groundY - 140 * scale)
      }
    }

    // 兔子（右侧）
    if (status === GameState.IDLE || status === GameState.TRANSFORM) {
      const rabbitX = W * 0.78
      ctx.font = `${140 * scale}px serif`

      if (status === GameState.TRANSFORM) {
        // 变身白光特效
        const p = timer / 1.5
        ctx.globalAlpha = 1 - p
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(rabbitX, groundY - 60 * scale, 80 * scale * (1 + p), 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      ctx.fillText('🐰', rabbitX, groundY)
    }

    // 兔子小孩
    if ([
      GameState.PLAYING,
      GameState.FAIL_CRY,
      GameState.BOMB,
      GameState.HUG
    ].includes(status)) {
      const kidX = W * 0.6
      let y = groundY

      if (status === GameState.FAIL_CRY) {
        // 坐在地上哭
        ctx.font = `${110 * scale}px serif`
        ctx.fillText('😭', kidX, y)

        // 眼泪效果
        if (Math.random() < 0.3) {
          const particle = {
            x: kidX + (Math.random() - 0.5) * 40,
            y: y - 60 * scale,
            vx: (Math.random() - 0.5) * 20,
            vy: 100,
            life: 0.5,
            maxLife: 1,
            color: '#87CEEB',
            size: 3,
          }
          RenderUtils.spawnParticle(ctx, particle)
        }
      } else if (status === GameState.HUG) {
        // 被抱起
        const p = Math.min(timer / 1.5, 1)
        y = groundY - 100 * scale * p
        ctx.font = `${110 * scale}px serif`
        ctx.fillText('🥰', kidX, y)
      } else {
        // 正常状态
        ctx.font = `${120 * scale}px serif`
        ctx.fillText('🧒', kidX, y)

        // 拿着苍蝇拍
        ctx.font = `${60 * scale}px serif`
        ctx.fillText('🏸', kidX + 50 * scale, y - 60 * scale)
      }
    }
  }

  /**
   * 生成粒子并渲染（用于眼泪等效果）
   */
  private static spawnParticle(ctx: CanvasRenderingContext2D, particle: any): void {
    // 直接绘制粒子，不添加到状态中
    ctx.globalAlpha = Math.max(particle.life / particle.maxLife, 0)
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  /**
   * 屏幕震动效果
   */
  static applyScreenShake(ctx: CanvasRenderingContext2D, shake: number): void {
    if (shake > 0.5) {
      ctx.translate(
        (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake
      )
    }
  }
}