import type { Fly, Particle, FloatingText, Bomb, GameData } from './types/game'
import { GameState } from './constants'
import { CONFIG, ANIMATION_DURATIONS } from './constants'
import { FlyUtils } from './utils/Fly'
import { GameEngineUtils } from './utils/GameEngine'

export class GameEngine {
  private data: GameData

  constructor() {
    this.data = {
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
    }
  }

  getState(): GameData {
    return { ...this.data }
  }

  setState(newState: GameState): void {
    this.data.status = newState
    this.data.timer = 0

    if (newState === GameState.CURTAIN) {
      this.data.curtainY = -1
    }

    if (newState === GameState.BOMB) {
      this.data.bomb = GameEngineUtils.initBomb(window.innerWidth, window.innerHeight)
    }

    if (newState === GameState.TRANSFORM) {
      // 添加变身特效
      this.addTransformEffect()
    }
  }

  addTransformEffect(): void {
    for (let i = 0; i < 30; i++) {
      this.data.particles.push({
        x: window.innerWidth * 0.75 + (Math.random() - 0.5) * 100,
        y: window.innerHeight * 0.6 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 0.5,
        maxLife: 1,
        color: '#ffffff',
        size: 3,
      })
    }
  }

  update(deltaTime: number): void {
    const dt = deltaTime

    // 更新计时器
    this.data.timer += dt

    // 更新难度
    this.data.difficulty += dt * 0.08

    // 更新苍蝇
    for (const fly of this.data.flies) {
      FlyUtils.update(fly, dt, window.innerWidth, window.innerHeight)
    }
    this.data.flies = GameEngineUtils.cleanUpFlies(this.data.flies)

    // 生成新苍蝇
    if (GameEngineUtils.shouldSpawn(
      this.data.spawnTimer,
      this.data.flies,
      CONFIG.MAX_FLIES,
      this.data.difficulty
    )) {
      this.data.flies.push(FlyUtils.create(window.innerWidth, window.innerHeight, this.data.difficulty))
      this.data.spawnTimer = -Math.max(0.35, 1.1 - this.data.difficulty * 0.05)
    }

    // 更新粒子
    GameEngineUtils.updateParticles(this.data.particles, dt)

    // 更新浮动文字
    GameEngineUtils.updateFloatingTexts(this.data.texts, dt)

    // 更新手雷
    if (this.data.bomb) {
      GameEngineUtils.updateBomb(this.data.bomb, dt)
      if (this.data.bomb.exploded) {
        // 爆炸效果
        for (const fly of this.data.flies) {
          this.addParticle({
            x: fly.x,
            y: fly.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.3,
            maxLife: 0.5,
            color: '#ff8c00',
            size: 5,
          })
        }
        // 爆炸中心粒子
        this.addParticle({
          x: this.data.bomb.targetX,
          y: this.data.bomb.targetY,
          vx: 0,
          vy: 0,
          life: 1,
          maxLife: 1.5,
          color: '#ffaa00',
          size: 20,
        })
        this.data.flies = []
      }
    }

    // 更新幕布
    if (this.data.status === GameState.CURTAIN) {
      this.data.curtainY += dt * 1.2
    }

    // 更新震动效果
    this.data.shake *= 0.85

    // 检查状态转换
    this.checkStateTransition()
  }

  private checkStateTransition(): void {
    switch (this.data.status) {
      case GameState.IDLE:
        if (this.data.timer > 2.5) {
          this.setState(GameState.TRANSFORM)
        }
        break
      case GameState.TRANSFORM:
        if (this.data.timer > ANIMATION_DURATIONS.TRANSFORM) {
          this.setState(GameState.PLAYING)
        }
        break
      case GameState.PLAYING:
        if (this.data.hits > 0 && this.data.flies.length === 0 && this.data.timer > 3) {
          this.setState(GameState.BOMB)
        }
        break
      case GameState.FAIL_CRY:
        if (this.data.timer > 2.5) {
          this.setState(GameState.BOMB)
        }
        break
      case GameState.BOMB:
        if (this.data.bomb?.exploded && this.data.timer > ANIMATION_DURATIONS.BOMB_THROW) {
          this.setState(GameState.HUG)
        }
        break
      case GameState.HUG:
        if (this.data.timer > ANIMATION_DURATIONS.HUG_DURATION) {
          this.setState(GameState.CURTAIN)
        }
        break
      case GameState.CURTAIN:
        if (this.data.timer > ANIMATION_DURATIONS.CURTAIN_DURATION) {
          this.setState(GameState.RESULT)
          // 检查是否新高分
          const highScore = Number(localStorage.getItem(CONFIG.HIGH_SCORE_KEY) || 0)
          this.data.isNewHigh = this.data.score > highScore
        }
        break
    }

    // 打满10次触发哭戏
    if (this.data.missCount >= CONFIG.MAX_MISS &&
        this.data.status !== GameState.FAIL_CRY &&
        this.data.status !== GameState.BOMB &&
        this.data.status !== GameState.RESULT) {
      this.setState(GameState.FAIL_CRY)
    }
  }

  // 事件处理
  handleHit(fly: Fly): void {
    const comboBonus = Math.floor(this.data.combo / 5) * 2
    this.data.score += fly.score + comboBonus
    this.data.hits++
    this.data.combo++
    this.addParticle({
      x: fly.x,
      y: fly.y,
      vx: 0,
      vy: 0,
      life: 0.5,
      maxLife: 0.8,
      color: fly.type === 'gold' ? '#ffd700' : '#4a4a4a',
      size: 3,
    })
    fly.alive = false
  }

  handleMiss(x: number, y: number): void {
    this.data.missCount++
    this.data.combo = 0
    this.data.shake = 3

    // 检查附近是否有金苍蝇
    const goldNear = this.data.flies.some(fly =>
      fly.type === 'gold' &&
      Math.pow(fly.x - x, 2) + Math.pow(fly.y - y, 2) < 150 * 150
    )
    if (goldNear) {
      GameEngineUtils.spawnFloatingText(this.data.texts, '打不着打不着', x, y - 20, '#ffd700')
    }
  }

  // 粒子和文字管理
  addParticle(particle: Particle): void {
    this.data.particles.push(particle)
    if (this.data.particles.length > CONFIG.MAX_PARTICLES) {
      this.data.particles = this.data.particles.slice(-CONFIG.MAX_PARTICLES)
    }
  }

  addText(text: FloatingText): void {
    this.data.texts.push(text)
  }

  // 重置游戏
  reset(): void {
    this.data = {
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
    }
  }

  // 获取当前状态
  getStatus(): GameState {
    return this.data.status
  }

  getScore(): number {
    return this.data.score
  }

  getMissCount(): number {
    return this.data.missCount
  }

  getHits(): number {
    return this.data.hits
  }
}