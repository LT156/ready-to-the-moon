// cubeUtils.ts —— 魔方核心逻辑：Three.js 建模、层旋转、打乱、还原检测
import * as THREE from 'three'
import type { Axis, Direction, Face, Move } from '../types/game'
import { FACE_COLORS, FACE_CONFIG } from '../types/game'

const CUBIE_SIZE = 0.93       // 小立方体边长（<1 留缝隙）
const ANIM_DURATION = 220      // 单步动画时长 ms
const SCRAMBLE_ANIM = 80       // 打乱时动画时长 ms

// ---- 魔方建模 ----

/** 创建单个小立方体（带6面材质） */
function createCubie(x: number, y: number, z: number): THREE.Mesh {
  const geo = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE)
  // 6面材质顺序：+X, -X, +Y, -Y, +Z, -Z
  const mats = [
    makeFaceMat(x === 1 ? FACE_COLORS.R : '#1a1a2e', x === 1),   // +X → R
    makeFaceMat(x === -1 ? FACE_COLORS.L : '#1a1a2e', x === -1), // -X → L
    makeFaceMat(y === 1 ? FACE_COLORS.U : '#1a1a2e', y === 1),   // +Y → U
    makeFaceMat(y === -1 ? FACE_COLORS.D : '#1a1a2e', y === -1), // -Y → D
    makeFaceMat(z === 1 ? FACE_COLORS.F : '#1a1a2e', z === 1),   // +Z → F
    makeFaceMat(z === -1 ? FACE_COLORS.B : '#1a1a2e', z === -1), // -Z → B
  ]
  const mesh = new THREE.Mesh(geo, mats)
  mesh.position.set(x, y, z)
  return mesh
}

function makeFaceMat(color: string, isOuter: boolean): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: isOuter ? 0.35 : 0.9,
    metalness: isOuter ? 0.05 : 0,
  })
}

/** 创建完整的魔方（27个小立方体） */
export function createCubeGroup(): THREE.Group {
  const group = new THREE.Group()
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        group.add(createCubie(x, y, z))
      }
    }
  }
  return group
}

// ---- 层旋转 ----

/** 收集指定轴+层的所有小立方体 */
function collectLayer(
  cubeGroup: THREE.Group,
  axis: Axis,
  layer: number,
): THREE.Mesh[] {
  const result: THREE.Mesh[] = []
  for (const child of cubeGroup.children) {
    const mesh = child as THREE.Mesh
    const coord = Math.round(mesh.position[axis])
    if (coord === layer) result.push(mesh)
  }
  return result
}

/** 将 position 四舍五入到整数网格（消除浮点误差） */
function roundPosition(mesh: THREE.Mesh) {
  mesh.position.x = Math.round(mesh.position.x)
  mesh.position.y = Math.round(mesh.position.y)
  mesh.position.z = Math.round(mesh.position.z)
}

/**
 * 执行一次层旋转动画。
 * 返回 Promise，动画完成后 resolve。
 */
export function animateRotation(
  cubeGroup: THREE.Group,
  face: Face,
  direction: Direction,
  duration: number = ANIM_DURATION,
): Promise<void> {
  return new Promise((resolve) => {
    const config = FACE_CONFIG[face]
    const angle = direction === 'cw' ? config.cwAngle : -config.cwAngle
    const axis = config.axis
    const layer = config.layer

    const cubies = collectLayer(cubeGroup, axis, layer)
    if (cubies.length === 0) { resolve(); return }

    // 临时 Group
    const pivot = new THREE.Group()
    cubeGroup.add(pivot)
    for (const c of cubies) pivot.attach(c)

    const axisVec = new THREE.Vector3(
      axis === 'x' ? 1 : 0,
      axis === 'y' ? 1 : 0,
      axis === 'z' ? 1 : 0,
    )
    const startQuat = new THREE.Quaternion()
    const endQuat = new THREE.Quaternion().setFromAxisAngle(axisVec, angle)
    const startTime = performance.now()

    function tick() {
      const t = Math.min((performance.now() - startTime) / duration, 1)
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 // ease-in-out
      pivot.quaternion.copy(startQuat).slerp(endQuat, ease)

      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        // 动画完成：将立方体移回主 Group
        pivot.quaternion.copy(endQuat)
        pivot.updateMatrixWorld(true)
        for (const c of cubies) {
          cubeGroup.attach(c)
          roundPosition(c)
        }
        cubeGroup.remove(pivot)
        resolve()
      }
    }
    requestAnimationFrame(tick)
  })
}

// ---- 打乱 ----

/** 生成打乱序列（20~25步，避免连续同面） */
export function generateScramble(length: number = 22): Move[] {
  const faces: Face[] = ['U', 'D', 'R', 'L', 'F', 'B']
  const dirs: Direction[] = ['cw', 'ccw']
  const moves: Move[] = []
  let lastFace: Face | null = null

  for (let i = 0; i < length; i++) {
    let face: Face
    do {
      face = faces[Math.floor(Math.random() * faces.length)]
    } while (face === lastFace)
    const dir = dirs[Math.floor(Math.random() * dirs.length)]
    moves.push({ face, direction: dir })
    lastFace = face
  }
  return moves
}

/** 执行打乱动画序列 */
export async function animateScramble(
  cubeGroup: THREE.Group,
  moves: Move[],
): Promise<void> {
  for (const move of moves) {
    await animateRotation(cubeGroup, move.face, move.direction, SCRAMBLE_ANIM)
  }
}

// ---- 还原检测 ----

/** 检测魔方是否已还原：每个面的9个贴片颜色一致 */
export function isSolved(cubeGroup: THREE.Group): boolean {
  const checks: { axis: Axis; layer: number; matIndex: number }[] = [
    { axis: 'x', layer: 1, matIndex: 0 },   // R 面 → +X 材质
    { axis: 'x', layer: -1, matIndex: 1 },  // L 面 → -X 材质
    { axis: 'y', layer: 1, matIndex: 2 },   // U 面 → +Y 材质
    { axis: 'y', layer: -1, matIndex: 3 },  // D 面 → -Y 材质
    { axis: 'z', layer: 1, matIndex: 4 },   // F 面 → +Z 材质
    { axis: 'z', layer: -1, matIndex: 5 },  // B 面 → -Z 材质
  ]

  for (const check of checks) {
    const cubies = collectLayer(cubeGroup, check.axis, check.layer)
    if (cubies.length !== 9) return false

    const colors = new Set<string>()
    for (const mesh of cubies) {
      const mat = getVisibleFaceColor(mesh, check.axis, check.layer)
      colors.add(mat)
    }
    if (colors.size !== 1) return false
  }
  return true
}

/**
 * 获取小立方体在指定面方向上当前显示的颜色。
 * 思路：将局部面法线通过世界旋转变换，看哪个材质面现在朝向目标方向。
 */
function getVisibleFaceColor(
  mesh: THREE.Mesh,
  targetAxis: Axis,
  targetLayer: number,
): string {
  const localNormals = [
    new THREE.Vector3(1, 0, 0),   // +X → mat[0]
    new THREE.Vector3(-1, 0, 0),  // -X → mat[1]
    new THREE.Vector3(0, 1, 0),   // +Y → mat[2]
    new THREE.Vector3(0, -1, 0),  // -Y → mat[3]
    new THREE.Vector3(0, 0, 1),   // +Z → mat[4]
    new THREE.Vector3(0, 0, -1),  // -Z → mat[5]
  ]

  const targetDir = new THREE.Vector3(
    targetAxis === 'x' ? targetLayer : 0,
    targetAxis === 'y' ? targetLayer : 0,
    targetAxis === 'z' ? targetLayer : 0,
  )

  let bestIdx = 0
  let bestDot = -Infinity
  const quat = mesh.getWorldQuaternion(new THREE.Quaternion())

  for (let i = 0; i < 6; i++) {
    const worldNormal = localNormals[i].clone().applyQuaternion(quat)
    const dot = worldNormal.dot(targetDir)
    if (dot > bestDot) {
      bestDot = dot
      bestIdx = i
    }
  }

  const mats = mesh.material as THREE.MeshStandardMaterial[]
  return '#' + mats[bestIdx].color.getHexString()
}

// ---- 重置 ----

/** 销毁旧魔方，创建新的已还原魔方 */
export function resetCubeGroup(cubeGroup: THREE.Group): THREE.Group {
  for (const child of cubeGroup.children) {
    const mesh = child as THREE.Mesh
    mesh.geometry.dispose()
    ;(mesh.material as THREE.Material[]).forEach((m) => m.dispose())
  }
  cubeGroup.clear()
  const fresh = createCubeGroup()
  for (const child of fresh.children) {
    cubeGroup.add(child)
  }
  return cubeGroup
}
