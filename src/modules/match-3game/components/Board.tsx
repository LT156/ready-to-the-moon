// Board.tsx —— 棋盘容器组件（Controller 层）
// 渲染网格布局 + SVG 连线动画层，分发点击事件
import { useEffect, useRef } from 'react'
import type { Board as BoardType, ConnectPath, Point, Tile as TileType } from '../types/game'
import { Tile } from './Tile'
import '../styles/game.css'

interface BoardProps {
  board: BoardType
  selected: TileType | null
  hint: [TileType, TileType] | null
  connectPath: ConnectPath | null
  onTileClick: (tile: TileType) => void
  onConnectAnimEnd: () => void
}

/** 根据棋盘尺寸 + 格子尺寸 + 间距，计算 Point 的像素中心坐标 */
function pointToPixel(
  p: Point,
  tileSize: number,
  gap: number,
): { x: number; y: number } {
  const step = tileSize + gap
  return {
    x: p.col * step + tileSize / 2,
    y: p.row * step + tileSize / 2,
  }
}

export function Board({
  board,
  selected,
  hint,
  connectPath,
  onTileClick,
  onConnectAnimEnd,
}: BoardProps) {
  const rows = board.length
  const cols = rows > 0 ? board[0].length : 0
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 读取 CSS 变量得到实际格子尺寸（响应式下会变化）
  const wrapRef = useRef<HTMLDivElement>(null)

  // 连线动画：出现后 450ms 自动清除
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (connectPath) {
      timerRef.current = setTimeout(onConnectAnimEnd, 450)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [connectPath, onConnectAnimEnd])

  // 计算格子尺寸和间距（与 CSS 变量同步）
  const tileSize = 48
  const gap = 6
  const step = tileSize + gap
  const svgW = cols * step - gap
  const svgH = rows * step - gap

  // 构建 SVG 连线 polyline 的 points 属性
  let svgPoints = ''
  if (connectPath && connectPath.points.length >= 2) {
    svgPoints = connectPath.points
      .map((p) => {
        const { x, y } = pointToPixel(p, tileSize, gap)
        return `${x},${y}`
      })
      .join(' ')
  }

  const hintIds = hint ? new Set([hint[0].id, hint[1].id]) : null

  return (
    <div
      className="game__board-wrap"
      ref={wrapRef}
    >
      <div
        className="game__board"
        style={{
          gridTemplateColumns: `repeat(${cols}, var(--tile-size))`,
          gridTemplateRows: `repeat(${rows}, var(--tile-size))`,
        }}
      >
        {board.flat().map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            isSelected={selected?.id === tile.id}
            isHint={hintIds?.has(tile.id) ?? false}
            onClick={onTileClick}
          />
        ))}
      </div>

      {/* SVG 连线动画层 */}
      {svgPoints && (
        <svg
          className="game__connect-svg"
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
        >
          <polyline
            className="game__connect-line"
            points={svgPoints}
          />
        </svg>
      )}
    </div>
  )
}
