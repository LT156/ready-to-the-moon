import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHOICES, FRAGS, HINTS, TOTAL } from '../data/gameData'
import type { FragmentKey, Stage } from '../types/game'
import '../styles/game.css'

export function Decrypt() {
  const navigate = useNavigate()

  const [stage, setStage] = useState<Stage>('intro')
  const [found, setFound] = useState<Set<FragmentKey>>(new Set())
  /** 点击后先播放翻转/亮屏动画，稍后再收集 */
  const [flips, setFlips] = useState<Set<string>>(new Set())
  const [fragmentKey, setFragmentKey] = useState<FragmentKey | null>(null)
  /** 点击护照等特殊场景的临时提示；null 时按收集进度显示阶梯提示 */
  const [overrideHint, setOverrideHint] = useState<string | null>(null)
  const [wrongChoice, setWrongChoice] = useState<number | null>(null)
  /** 机票拖到护照上组合 */
  const [combined, setCombined] = useState(false)
  /** 碎镜拖到拼合区拼合 */
  const [assembled, setAssembled] = useState(false)

  const phoneRef = useRef<HTMLDivElement>(null)
  const ticketRef = useRef<HTMLDivElement>(null)
  const passportRef = useRef<HTMLDivElement>(null)
  const glassRef = useRef<HTMLDivElement>(null)
  /** 拖拽中物件及其相对指针的偏移 */
  const drag = useRef<{ key: 'ticket' | 'glass'; x: number; y: number } | null>(null)
  /** 组件卸载时清掉残留的定时器 */
  const timers = useRef<number[]>([])

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => () => {
    timers.current.forEach((t) => window.clearTimeout(t))
  }, [])

  const flip = useCallback((key: string) => {
    setFlips((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [])

  const collect = useCallback((key: FragmentKey) => {
    setFound((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
    setOverrideHint(null)
    setFragmentKey(key)
  }, [])

  // 阶梯提示由收集进度直接推导，无需 effect
  const hintHtml =
    found.size >= TOTAL
      ? '六段经历都读完了。<b>去推理那个舞台。</b>'
      : HINTS[Math.min(found.size, HINTS.length - 1)]

  // 集齐后自动进入推理面板
  useEffect(() => {
    if (stage !== 'backstage' || found.size < TOTAL) return
    const t = window.setTimeout(() => setStage('deduce'), 700)
    return () => window.clearTimeout(t)
  }, [found, stage])

  // ---------- 点击类物件 ----------

  // 学生证：点击翻转
  const handleIdClick = () => {
    if (found.has('id') || flips.has('id')) return
    flip('id')
    later(() => collect('id'), 260)
  }

  // 短信：点击亮屏即读
  const handleSmsClick = () => {
    if (found.has('sms')) return
    collect('sms')
  }

  // 恶评手机：点击后屏幕变化
  const handlePhoneClick = () => {
    if (found.has('phone') || flips.has('phone')) return
    flip('phone')
    later(() => collect('phone'), 260)
  }

  // 面具：点击翻面
  const handleMaskClick = () => {
    if (found.has('mask') || flips.has('mask')) return
    flip('mask')
    later(() => collect('mask'), 260)
  }

  // 护照：单独点它提示去找机票
  const handlePassportClick = () => {
    if (combined) return
    setOverrideHint('这本护照好像缺了点什么。<b>找找有没有能和它放在一起的物件。</b>')
  }

  // ---------- 拖拽（机票组合 / 碎镜拼合） ----------

  const overlaps = (a: HTMLElement | null, b: HTMLElement | null) => {
    if (!a || !b) return false
    const ra = a.getBoundingClientRect()
    const rb = b.getBoundingClientRect()
    return !(ra.right < rb.left || ra.left > rb.right || ra.bottom < rb.top || ra.top < rb.bottom)
  }

  const startDrag = (key: 'ticket' | 'glass', e: React.PointerEvent<HTMLDivElement>) => {
    if (key === 'ticket' && (found.has('ticket') || combined)) return
    if (key === 'glass' && (found.has('glass') || assembled)) return
    const el = key === 'ticket' ? ticketRef.current : glassRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    drag.current = { key, x: e.clientX - rect.left, y: e.clientY - rect.top }
    el.setPointerCapture(e.pointerId)
    el.style.zIndex = '45'
    el.style.cursor = 'grabbing'
  }

  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const phone = phoneRef.current
    const el = d.key === 'ticket' ? ticketRef.current : glassRef.current
    if (!phone || !el) return
    const rect = phone.getBoundingClientRect()
    const w = el.offsetWidth
    const h = el.offsetHeight
    const x = Math.max(0, Math.min(rect.width - w, e.clientX - rect.left - d.x))
    const y = Math.max(0, Math.min(rect.height - h, e.clientY - rect.top - d.y))
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    if (d.key === 'ticket') {
      if (overlaps(ticketRef.current, passportRef.current)) combineTicket()
    } else if (
      x > rect.width * 0.45 &&
      y > rect.height * 0.45 &&
      Math.abs(x - rect.width * 0.58) < 70
    ) {
      assembleGlass()
    }
  }

  const endDrag = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    const el = d.key === 'ticket' ? ticketRef.current : glassRef.current
    if (!el) return
    // 未成功时回弹到原位
    el.style.left = ''
    el.style.top = ''
    el.style.zIndex = ''
    el.style.cursor = ''
  }

  const resetDragStyles = (el: HTMLElement | null) => {
    if (!el) return
    el.style.left = ''
    el.style.top = ''
    el.style.zIndex = ''
    el.style.cursor = ''
  }

  const combineTicket = () => {
    if (found.has('ticket') || combined) return
    drag.current = null
    resetDragStyles(ticketRef.current)
    setCombined(true)
    later(() => collect('ticket'), 200)
  }

  const assembleGlass = () => {
    if (found.has('glass') || assembled) return
    drag.current = null
    resetDragStyles(glassRef.current)
    setAssembled(true)
    later(() => collect('glass'), 200)
  }

  // ---------- 推理与结算 ----------

  const guess = (index: number, correct: boolean) => {
    if (correct) {
      setStage('unlock')
      return
    }
    setWrongChoice(index)
    later(() => setWrongChoice(null), 400)
  }

  const restart = () => {
    setStage('intro')
    setFound(new Set())
    setFlips(new Set())
    setFragmentKey(null)
    setWrongChoice(null)
    setCombined(false)
    setAssembled(false)
    setOverrideHint(null)
    drag.current = null
    ;[ticketRef.current, glassRef.current].forEach((el) => resetDragStyles(el))
  }

  const startGame = () => setStage('backstage')
  const frag = fragmentKey ? FRAGS[fragmentKey] : null

  return (
    <div className="decrypt">
      {/* 顶部导航 */}
      <button className="dec-back" onClick={() => navigate('/')} style={{ fontSize: 15, padding: '6px 12px' }}>
        ← 返回
      </button>

      <div className="dec-phone grain" ref={phoneRef}>
        {/* 开场引导 */}
        <div className={`dec-intro ${stage !== 'intro' ? 'hide' : ''}`}>
          <div className="seal">⏳</div>
          <h1>平 行 时 空</h1>
          <p>你走进一间<b>后台空间</b>，这里散落着一个人留下的东西。</p>
          <p className="how">点击、翻转、拼合这些物件，<br />读出他经历过什么。<br />集齐 <b>6 段经历</b>后，<br />推理出这里属于哪一个舞台。</p>
          <p className="dim">发光 / 高亮的物件都可以点。</p>
          <button onClick={startGame}>走 进 后 台</button>
        </div>

        {/* HUD */}
        {stage === 'backstage' && (
          <div className="dec-hud">
            <span>经历碎片</span>
            <span className="counter">{found.size} / {TOTAL}</span>
          </div>
        )}

        {/* 场景一：后台空间 */}
        <div className={`scene backstage ${stage === 'backstage' ? 'active' : ''}`}>
          <div className="wall-floor" />

          {/* 学生证 */}
          <div
            className={`item it-id ${found.has('id') ? 'done' : ''}`}
            onClick={handleIdClick}
          >
            <div className="art">
              <span className="glyph" style={flips.has('id') ? { fontSize: '13px' } : undefined}>
                {flips.has('id') ? '南航' : '证'}
              </span>
            </div>
            <span className="label">{flips.has('id') ? '南航学生证' : '学生证'}</span>
          </div>

          {/* 机票存根（可拖拽） */}
          <div
            ref={ticketRef}
            className={`item it-ticket ${found.has('ticket') ? 'done' : ''}`}
            onPointerDown={(e) => startDrag('ticket', e)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div className="art"><span className="glyph">票</span></div>
            <span className="label">机票存根</span>
          </div>

          {/* 护照（组合目标） */}
          <div
            ref={passportRef}
            className="item it-passport"
            onClick={handlePassportClick}
          >
            <div className="art"><span className="glyph">{combined ? '✈' : '照'}</span></div>
            <span className="label">{combined ? '护照 + 机票' : '护照'}</span>
          </div>

          {/* 短信 */}
          <div
            className={`item it-sms ${found.has('sms') ? 'done' : ''}`}
            onClick={handleSmsClick}
          >
            <div className="art">
              <div className="phone-screen">
                <div className="phone-notify">1 条新短信</div>
                <div style={{ marginTop: 6 }}>“你想当<br />偶像吗？”</div>
              </div>
            </div>
            <span className="label">一条短信</span>
          </div>

          {/* 恶评手机 */}
          <div
            className={`item it-phone ${found.has('phone') ? 'done' : ''}`}
            onClick={handlePhoneClick}
          >
            <div className="art">
              <div
                className="phone-screen"
                style={flips.has('phone') ? { color: '#e6b98a' } : { color: '#c98a7e' }}
              >
                {flips.has('phone') ? (
                  <>被人群<br />盯着的屏幕</>
                ) : (
                  <>恶评<br />刷屏中</>
                )}
              </div>
            </div>
            <span className="label">亮着的手机</span>
          </div>

          {/* 小丑面具 */}
          <div
            className={`item it-mask ${found.has('mask') ? 'done' : ''}`}
            onClick={handleMaskClick}
          >
            <div className="art" style={flips.has('mask') ? { background: '#c98a7e' } : undefined}>
              <span className="glyph">{flips.has('mask') ? '笑' : '面'}</span>
            </div>
            <span className="label">小丑面具</span>
          </div>

          {/* 碎镜（可拖拽） */}
          <div
            ref={glassRef}
            className={`item it-glass ${found.has('glass') ? 'done' : ''} ${assembled ? '' : 'shard'}`}
            onPointerDown={(e) => startDrag('glass', e)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div className="art">
              <span className="glyph" style={{ opacity: assembled ? '1' : '.6' }}>镜</span>
            </div>
            <span className="label">{assembled ? '拼合的镜子' : '碎掉的镜子'}</span>
          </div>
        </div>

        {/* 场景一：底部提示条 */}
        {stage === 'backstage' && (
          <div
            className="dec-hint"
            dangerouslySetInnerHTML={{ __html: overrideHint ?? hintHtml }}
          />
        )}

        {/* 场景二：经历碎片弹层 */}
        {frag && (
          <div className="dec-fragment">
            <div className="card">
              <div className="tag">经历碎片 · {frag.tag}</div>
              <h3>{frag.title}</h3>
              <p>{frag.text}</p>
              <button className="close" onClick={() => setFragmentKey(null)}>收 好</button>
            </div>
          </div>
        )}

        {/* 场景三：推理面板 */}
        {stage === 'deduce' && (
          <div className="scene active deduce">
            <div className="head">
              <h2>这是哪一个舞台？</h2>
              <p>你已经读完了 6 段经历。<br />根据这些碎片，选出它们指向的舞台。</p>
            </div>
            {CHOICES.map((c, i) => (
              <button
                key={c.label}
                className={`choice ${wrongChoice === i ? 'wrong' : ''}`}
                onClick={() => guess(i, c.correct)}
              >
                {c.label}
                <span className="sub">{c.sub}</span>
              </button>
            ))}
            <div className="deduce-note">选错了也没关系，可以再想。</div>
          </div>
        )}

        {/* 场景四：解锁页 */}
        {stage === 'unlock' && (
          <div className="scene active unlock">
            <h2>舞 台 解 锁</h2>
            <div className="song">《平行时空》 · 岳明辉</div>
            <div className="stage-anim">
              <div className="spark">✦</div>
              <div>[ 舞台造型动画占位 ]</div>
              <div className="anim-note">PLACEHOLDER_STAGE_ANIM</div>
            </div>
            <div className="desc">
              面具被摔碎，镜子围成的包围圈裂开一道光。<br />
              他从被凝视的商品，走回自己。
            </div>
            <button className="again" onClick={restart}>再 走 一 遍</button>
          </div>
        )}
      </div>
    </div>
  )
}
