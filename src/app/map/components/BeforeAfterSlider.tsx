'use client'

import { useRef, useState, useCallback } from 'react'
import styles from './BeforeAfterSlider.module.css'

interface Props {
  before: string
  after: string
}

export function BeforeAfterSlider({ before, after }: Props) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setPosition((x / rect.width) * 100)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }, [updatePosition])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    updatePosition(e.clientX)
  }, [updatePosition])

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return (
    <div className={styles.slider} id="before-after-slider">
      <div
        ref={containerRef}
        className={styles.imgWrap}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className={styles.imgAfter}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={after} alt="After resolution" />
        </div>
        <div className={styles.imgBefore} style={{ width: `${position}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before} alt="Before resolution" />
        </div>
        <div className={styles.handle} style={{ left: `${position}%` }}>
          <div className={styles.handleCircle}>⟷</div>
        </div>
      </div>
      <div className={styles.labels}>
        <span>Before</span>
        <span>After</span>
      </div>
    </div>
  )
}
