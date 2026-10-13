// Lianliankan.tsx —— 连连看游戏主入口组件
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_CONFIG } from '../utils/boardUtils'
import { useLianliankan } from '../hooks/useLianliankan'
import { useTimer, formatTime } from '../hooks/useTimer'
import { Board } from './Board'
import { GameStatus } from './GameStatus'
import { GameControls } from './GameControls'
import '../styles/game.css'

export function Lianliankan() {
  const navigate = useNavigate()
  const { state, onTileClick, restart, shuffle, hint, clearConnect } =
    useLianliankan(DEFAULT_CONFIG)

  const running = state.status === 'playing'
  const elapsed = useTimer(state.startTime, running)
  const time = formatTime(elapsed)

  const handleRestart = useCallback(() => {
    restart()
  }, [restart])

  const handleStuckShuffle = useCallback(() => {
    shuffle()
  }, [shuffle])

  return (
    <div className="game">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          className="game__btn"
          onClick={() => navigate('/')}
          style={{ fontSize: 18, padding: '6px 12px' }}
        >
          ← 返回
        </button>
        <h1 className="game__title" style={{ margin: 0 }}>🌙 连连看</h1>
      </div>

      <GameStatus
        steps={state.steps}
        remaining={state.remaining}
        time={time}
        status={state.status}
      />

      <Board
        board={state.board}
        selected={state.selected}
        hint={state.hint}
        connectPath={state.connectPath}
        onTileClick={onTileClick}
        onConnectAnimEnd={clearConnect}
      />

      <GameControls
        onRestart={handleRestart}
        onHint={hint}
        onShuffle={handleStuckShuffle}
        status={state.status}
      />

      {/* 胜利弹窗 */}
      {state.status === 'won' && (
        <div className="game__overlay">
          <div className="game__modal">
            <h2 className="game__modal-title">🎉 恭喜通关！</h2>
            <p className="game__modal-text">
              用时 {time} · 步数 {state.steps}
            </p>
            <button className="game__btn game__btn--primary" onClick={handleRestart}>
              再来一局
            </button>
          </div>
        </div>
      )}

      {/* 无解弹窗 */}
      {state.status === 'stuck' && (
        <div className="game__overlay">
          <div className="game__modal">
            <h2 className="game__modal-title">😰 没有可消除的格子了</h2>
            <p className="game__modal-text">试试洗牌，或许就能继续！</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="game__btn game__btn--primary" onClick={handleStuckShuffle}>
                🔀 洗牌
              </button>
              <button className="game__btn" onClick={handleRestart}>
                🔄 重新开始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
