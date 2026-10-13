// GameStatus.tsx —— 游戏状态栏（步数 / 剩余 / 时间）
import '../styles/game.css'

interface GameStatusProps {
  steps: number
  remaining: number
  time: string
  status: string
}

export function GameStatus({ steps, remaining, time, status }: GameStatusProps) {
  const statusLabel =
    status === 'won'
      ? '🎉 胜利！'
      : status === 'stuck'
        ? '😰 无解'
        : status === 'playing'
          ? '🎮 游戏中'
          : '⏳ 待开始'

  return (
    <div className="game__status">
      <span className="game__status-item">
        状态：<span className="game__status-value">{statusLabel}</span>
      </span>
      <span className="game__status-item">
        步数：<span className="game__status-value">{steps}</span>
      </span>
      <span className="game__status-item">
        剩余：<span className="game__status-value">{remaining}</span>
      </span>
      <span className="game__status-item">
        时间：<span className="game__status-value">{time}</span>
      </span>
    </div>
  )
}
