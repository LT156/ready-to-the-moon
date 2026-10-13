// useTimer.ts —— 计时器 Hook
import { useEffect, useState } from 'react'

/**
 * 以 startTime 为起点计时；当 running 为 false 时停止。
 * 返回已过秒数。
 */
export function useTimer(startTime: number, running: boolean): number {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!running || startTime === 0) {
      setElapsed(0)
      return
    }
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startTime) / 1000)))
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [startTime, running])

  return elapsed
}

/** 格式化秒为 mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
