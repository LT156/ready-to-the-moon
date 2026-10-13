// ParticleBackground.tsx —— 星空粒子背景（tsparticles v4）
import { useCallback } from 'react'
import { Particles, ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Container, Engine, ISourceOptions } from '@tsparticles/engine'

/** 星空配置：白色/淡紫星星 + 缓慢漂移 + 鼠标引力连线 */
const starryOptions: ISourceOptions = {
  fullScreen: { enable: false },
  background: {
    color: { value: 'transparent' },
  },
  fpsLimit: 60,
  particles: {
    color: { value: ['#ffffff', '#c4b5fd', '#818cf8', '#a78bfa'] },
    links: {
      color: '#a78bfa',
      distance: 150,
      enable: true,
      opacity: 0.15,
      width: 1,
    },
    move: {
      enable: true,
      speed: 0.6,
      direction: 'none',
      random: true,
      straight: false,
      outModes: { default: 'out' },
    },
    number: {
      density: { enable: true, width: 1920, height: 1080 },
      value: 80,
    },
    opacity: {
      value: { min: 0.2, max: 0.8 },
      animation: {
        enable: true,
        speed: 0.5,
        minimumValue: 0.1,
        sync: false,
      },
    },
    shape: { type: 'circle' },
    size: {
      value: { min: 1, max: 3 },
      animation: {
        enable: true,
        speed: 1,
        minimumValue: 0.5,
        sync: false,
      },
    },
  },
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: 'grab',
      },
      onClick: {
        enable: true,
        mode: 'push',
      },
    },
    modes: {
      grab: {
        distance: 180,
        links: { opacity: 0.35 },
      },
      push: { quantity: 2 },
    },
  },
  detectRetina: true,
}

/** 引擎初始化函数，传给 ParticlesProvider */
async function initEngine(engine: Engine): Promise<void> {
  await loadSlim(engine)
}

export function ParticleBackground() {
  const particlesLoaded = useCallback(
    async (_container?: Container) => {
      // 引擎就绪
    },
    [],
  )

  return (
    <ParticlesProvider init={initEngine}>
      <Particles
        id="starry-bg"
        particlesLoaded={particlesLoaded}
        options={starryOptions}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'auto',
        }}
      />
    </ParticlesProvider>
  )
}
