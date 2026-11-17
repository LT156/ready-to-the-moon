import { useNavigate } from 'react-router-dom'
import { ParticleBackground } from '../components/ParticleBackground'

const games = [
  {
    title: '🌙连连看',
    desc: '消除相同图案，路径最多转折两次',
    path: '/match-3game',
  },
  {
    title: '🧊3D魔方',
    desc: '旋转层归位，还原三阶魔方',
    path: '/rubiks-cube',
  },
  {
    title: '🪰打苍蝇',
    desc: '点击苍蝇，别让它们烦人',
    path: '/hit-bugs',
  },
  {
    title: '⏳解密·平行时空',
    desc: '翻找后台物件，集齐碎片推理舞台',
    path: '/decrypt',
  },
]

export function HomePage() {
  const navigate = useNavigate()

  return (
    <>
      {/* 星空粒子背景 */}
      <ParticleBackground />

      {/* 内容层：在粒子之上 */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100svh',
        background: 'radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #0f0a1a 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: 24,
      }}>
        <h1 style={{
          fontSize: 48,
          fontWeight: 700,
          margin: 0,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: 2,
          lineHeight: 1.2,
        }}>
          🌙 Ready To The Moon
        </h1>

        <p style={{
          fontSize: 18,
          color: '#c4b5fd',
          margin: 0,
          textShadow: '0 0 12px rgba(167,139,250,0.4)',
        }}>
          选择一个游戏开始挑战
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          justifyContent: 'center',
          maxWidth: 600,
        }}>
          {games.map((g) => (
            <button
              key={g.path}
              onClick={() => navigate(g.path)}
              style={{
                width: 240,
                padding: '28px 24px',
                borderRadius: 16,
                border: '1px solid rgba(167,139,250,0.3)',
                background: 'rgba(30,27,75,0.6)',
                color: '#e0e7ff',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(102,126,234,0.2)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'
                e.currentTarget.style.boxShadow = '0 16px 32px rgba(102,126,234,0.35)'
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.2)'
                e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{g.title}</div>
              <div style={{ fontSize: 14, color: '#a5b4fc', lineHeight: 1.5 }}>
                {g.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
