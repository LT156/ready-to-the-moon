import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameState } from '../constants'
import { useCanvasGame } from '../hooks/useCanvasGame'
import { useHitBugs } from '../hooks/useHitBugs'
import { GameEngine } from '../GameEngine'
import '../styles/game.css'

export function HitBugs() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engine = useHitBugs()
  const { engine: gameEngine, resize } = useCanvasGame(canvasRef)

  // 监听游戏状态变化并更新 React 状态
  useEffect(() => {
    if (!gameEngine) return

    const interval = setInterval(() => {
      const state = gameEngine.getState()
      engine.setState(state)
    }, 16) // 约60fps

    return () => clearInterval(interval)
  }, [gameEngine, engine])

  // 处理重新开始
  const handleRestart = () => {
    gameEngine?.reset()
  }

  return (
    <div className="hit-bugs">
      {/* 顶部导航 */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 100,
      }}>
        <button
          className="game__btn"
          onClick={() => navigate('/')}
          style={{ fontSize: 18, padding: '6px 12px' }}
        >
          ← 返回
        </button>
      </div>

      {/* HUD 显示 */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 50,
        right: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 100,
        pointerEvents: 'none',
      }}>
        <div className="hud-score">
          得分: {engine.state.score}
        </div>
        <div className="hud-lives">
          {'❤️'.repeat(Math.max(10 - engine.state.missCount, 0))}
          {'🖤'.repeat(Math.max(engine.state.missCount, 0))}
        </div>
      </div>

      {/* 游戏画布 */}
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      />

      {/* 游戏状态提示 */}
      {engine.state.status === GameState.TRANSFORM && (
        <div className="game__status-text">
          🌟 兔子正在变身...
        </div>
      )}

      {/* 失败哭戏提示 */}
      {engine.state.status === GameState.FAIL_CRY && (
        <div className="game__status-text">
          😭 兔子小朋友哭啦！
        </div>
      )}

      {/* 结算弹窗 */}
      {engine.state.status === GameState.RESULT && (
        <div className="game__overlay">
          <div className="game__modal">
            <h2 className="game__modal-title">🎉 打苍蝇结束！</h2>
            <p className="game__modal-text">
              得分: {engine.state.score}
            </p>
            <p className="game__modal-text">
              命中: {engine.state.hits} 只
            </p>
            <p className="game__modal-text">
              打空: {engine.state.missCount} 次
            </p>
            <p className="game__modal-text">
              {engine.state.isNewHigh && '🏆 新纪录！'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button
                className="game__btn game__btn--primary"
                onClick={handleRestart}
              >
                再来一局
              </button>
              <button
                className="game__btn"
                onClick={() => navigate('/')}
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}