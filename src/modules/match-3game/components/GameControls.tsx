// GameControls.tsx —— 控制按钮（重开 / 提示 / 洗牌）
import '../styles/game.css'

interface GameControlsProps {
  onRestart: () => void
  onHint: () => void
  onShuffle: () => void
  status: string
}

export function GameControls({ onRestart, onHint, onShuffle, status }: GameControlsProps) {
  const disabled = status === 'won'

  return (
    <div className="game__controls">
      <button className="game__btn game__btn--primary" onClick={onRestart}>
        🔄 重新开始
      </button>
      <button className="game__btn" onClick={onHint} disabled={disabled}>
        💡 提示
      </button>
      <button className="game__btn" onClick={onShuffle} disabled={disabled}>
        🔀 洗牌
      </button>
    </div>
  )
}
