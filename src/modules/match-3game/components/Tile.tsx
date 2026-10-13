// Tile.tsx —— 单个格子组件（DTO 层）
import type { Tile as TileType } from '../types/game'
import '../styles/game.css'

interface TileProps {
  tile: TileType
  isSelected: boolean
  isHint: boolean
  onClick: (tile: TileType) => void
}

export function Tile({ tile, isSelected, isHint, onClick }: TileProps) {
  const cls = [
    'tile',
    tile.removed && 'tile--removed',
    isSelected && 'tile--selected',
    isHint && 'tile--hint',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={cls}
      onClick={() => onClick(tile)}
      disabled={tile.removed}
      aria-label={`格子 ${tile.row + 1}行${tile.col + 1}列 ${tile.icon}`}
    >
      {tile.removed ? '' : tile.icon}
    </button>
  )
}
