// RubiksCube.tsx —— 魔方游戏主入口组件
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { useRubiksCube } from '../hooks/useRubiksCube'
import { useTimer, formatTime } from '../hooks/useTimer'
import {
  createCubeGroup,
  animateRotation,
  animateScramble,
  generateScramble,
  isSolved,
  resetCubeGroup,
} from '../utils/cubeUtils'
import type { Direction, Face } from '../types/game'
import '../styles/game.css'

/** 暴露给 CubeCanvas 的 ref 接口 */
export interface RubiksCubeRef {
  getCubeGroup: () => THREE.Group | null
  getScene: () => THREE.Scene | null
  setCubeGroup: (g: THREE.Group) => void
}

const FACES: { face: Face; label: string }[] = [
  { face: 'U', label: 'U' },
  { face: 'D', label: 'D' },
  { face: 'R', label: 'R' },
  { face: 'L', label: 'L' },
  { face: 'F', label: 'F' },
  { face: 'B', label: 'B' },
]

export function RubiksCube() {
  const navigate = useNavigate()
  const { state, startScramble, scrambleDone, rotate, win, reset } = useRubiksCube()
  const running = state.status === 'playing'
  const elapsed = useTimer(state.startTime, running)
  const time = formatTime(elapsed)

  // Three.js 对象引用
  const cubeGroupRef = useRef<THREE.Group | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const frameRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 动画锁：旋转中不允许新操作
  const [animating, setAnimating] = useState(false)

  // ---- 初始化 Three.js 场景 ----
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0d0d1a')
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(4, 3, 5)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.minDistance = 4
    controls.maxDistance = 12
    controlsRef.current = controls

    // 光照
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8)
    dir1.position.set(5, 8, 6)
    scene.add(dir1)
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.3)
    dir2.position.set(-4, -2, -5)
    scene.add(dir2)

    // 创建魔方
    const cubeGroup = createCubeGroup()
    cubeGroupRef.current = cubeGroup
    scene.add(cubeGroup)

    // 渲染循环
    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // 自适应
    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      controls.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  // ---- 首次加载 → 自动打乱 ----
  const hasScrambled = useRef(false)
  useEffect(() => {
    if (hasScrambled.current) return
    if (!cubeGroupRef.current) return
    hasScrambled.current = true

    const doScramble = async () => {
      const moves = generateScramble(22)
      startScramble(moves.length)
      setAnimating(true)
      await animateScramble(cubeGroupRef.current!, moves)
      setAnimating(false)
      scrambleDone()
    }
    doScramble()
  }, [startScramble, scrambleDone])

  // ---- 层旋转操作 ----
  const handleRotate = useCallback(async (face: Face, direction: Direction) => {
    if (animating || state.status !== 'playing') return
    if (!cubeGroupRef.current) return

    setAnimating(true)
    rotate(face, direction)
    await animateRotation(cubeGroupRef.current, face, direction)
    setAnimating(false)

    // 检测是否还原
    if (isSolved(cubeGroupRef.current)) {
      win()
    }
  }, [animating, state.status, rotate, win])

  // ---- 打乱 ----
  const handleScramble = useCallback(async () => {
    if (animating) return
    if (!cubeGroupRef.current) return

    const moves = generateScramble(22)
    startScramble(moves.length)
    setAnimating(true)
    await animateScramble(cubeGroupRef.current!, moves)
    setAnimating(false)
    scrambleDone()
  }, [animating, startScramble, scrambleDone])

  // ---- 重置 ----
  const handleReset = useCallback(() => {
    if (!cubeGroupRef.current) return
    resetCubeGroup(cubeGroupRef.current)
    reset()
    hasScrambled.current = false
    // 重新打乱
    const doScramble = async () => {
      const moves = generateScramble(22)
      startScramble(moves.length)
      setAnimating(true)
      await animateScramble(cubeGroupRef.current!, moves)
      setAnimating(false)
      scrambleDone()
    }
    setTimeout(doScramble, 50)
  }, [reset, startScramble, scrambleDone])

  const disabled = animating || state.status === 'scrambling' || state.status === 'won'

  return (
    <div className="rubik">
      {/* 顶部 */}
      <div className="rubik__header">
        <button className="rubik__btn" onClick={() => navigate('/')} style={{ fontSize: 16, padding: '4px 10px' }}>
          ← 返回
        </button>
        <h1 className="rubik__title">🧊 3D 魔方</h1>
      </div>

      <div className="rubik__status">
        <span className="rubik__status-item">
          状态：<span className="rubik__status-value">
            {state.status === 'won' ? '🎉 已还原' : state.status === 'scrambling' ? '🔀 打乱中' : state.status === 'playing' ? '🎮 游戏中' : '⏳ 待开始'}
          </span>
        </span>
        <span className="rubik__status-item">
          步数：<span className="rubik__status-value">{state.moves}</span>
        </span>
        <span className="rubik__status-item">
          时间：<span className="rubik__status-value">{time}</span>
        </span>
      </div>

      {/* 3D 画布 */}
      <div className="rubik__canvas-wrap" ref={containerRef} />

      {/* 控制按钮 */}
      <div className="rubik__controls">
        <button className="rubik__btn rubik__btn--primary" onClick={handleScramble} disabled={disabled}>
          🔀 打乱
        </button>
        <button className="rubik__btn" onClick={handleReset} disabled={state.status === 'scrambling'}>
          🔄 重置
        </button>
      </div>

      {/* 面旋转按钮：单击顺时针 / 右键逆时针 */}
      <div className="rubik__face-btns">
        {FACES.map(({ face, label }) => (
          <button
            key={face}
            className="rubik__face-btn"
            disabled={disabled}
            onClick={() => handleRotate(face, 'cw')}
            onContextMenu={(e) => {
              e.preventDefault()
              handleRotate(face, 'ccw')
            }}
            title={`${label}：单击顺时针 / 右键逆时针`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 胜利弹窗 */}
      {state.status === 'won' && (
        <div className="rubik__overlay">
          <div className="rubik__modal">
            <h2 className="rubik__modal-title">🎉 魔方已还原！</h2>
            <p className="rubik__modal-text">
              步数 {state.moves} · 用时 {time}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="rubik__btn rubik__btn--primary" onClick={handleReset}>
                再来一局
              </button>
              <button className="rubik__btn" onClick={() => navigate('/')}>
                返回首页
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
