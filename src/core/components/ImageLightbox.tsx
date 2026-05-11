'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/core/utils/cn'
import styles from './ImageLightbox.module.css'

interface ImageLightboxProps {
  images: string[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  
  // Transform state
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Sync state with initialIndex when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      resetTransform()
    }
  }, [isOpen, initialIndex])

  const resetTransform = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    resetTransform()
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    resetTransform()
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const handleZoom = (delta: number) => {
    setScale(prev => {
      const newScale = Math.min(Math.max(prev + delta, 1), 5)
      if (newScale === 1) setPosition({ x: 0, y: 0 })
      return newScale
    })
  }

  // Mouse / Touch handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.2 : 0.2
    handleZoom(delta)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight' && scale === 1) handleNext()
    if (e.key === 'ArrowLeft' && scale === 1) handlePrev()
    if (e.key === '+' || e.key === '=') handleZoom(0.5)
    if (e.key === '-') handleZoom(-0.5)
  }, [onClose, handleNext, handlePrev, scale])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div 
      className={styles.backdrop} 
      onClick={onClose}
      onWheel={handleWheel}
    >
      <div className={styles.topControls}>
        <div className={styles.zoomControls}>
          <button className={styles.controlBtn} onClick={(e) => { e.stopPropagation(); handleZoom(0.5); }} aria-label="Zoom in">
            🔍+
          </button>
          <button className={styles.controlBtn} onClick={(e) => { e.stopPropagation(); handleZoom(-0.5); }} aria-label="Zoom out">
            🔍-
          </button>
          <button className={styles.controlBtn} onClick={(e) => { e.stopPropagation(); resetTransform(); }} aria-label="Reset zoom">
            ↺
          </button>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div 
        className={styles.container} 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
      >
        <img 
          src={images[currentIndex]} 
          alt={`Full view ${currentIndex + 1}`} 
          className={styles.mainImage}
          onDoubleClick={resetTransform}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
        />

        {images.length > 1 && scale === 1 && (
          <>
            <button className={cn(styles.navBtn, styles.prev)} onClick={handlePrev} aria-label="Previous image">
              ‹
            </button>
            <button className={cn(styles.navBtn, styles.next)} onClick={handleNext} aria-label="Next image">
              ›
            </button>
          </>
        )}
        
        <div className={styles.infoFooter}>
          {images.length > 1 && (
            <div className={styles.counter}>
              {currentIndex + 1} / {images.length}
            </div>
          )}
          {scale > 1 && <div className={styles.zoomIndicator}>{Math.round(scale * 100)}%</div>}
        </div>
      </div>
    </div>
  )
}
