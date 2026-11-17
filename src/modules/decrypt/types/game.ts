// 解密游戏（平行时空 · 后台推理）类型定义

export type Stage = 'intro' | 'backstage' | 'deduce' | 'unlock'

/** 可收集为「经历碎片」的物件 key（护照与机票组合后算作 ticket 一个碎片） */
export type FragmentKey = 'id' | 'ticket' | 'sms' | 'phone' | 'mask' | 'glass'

/** 场景里所有物件 key */
export type ItemKey = FragmentKey | 'passport'

export interface Fragment {
  tag: string
  title: string
  text: string
}

export interface Choice {
  label: string
  sub: string
  correct: boolean
}
