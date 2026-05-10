'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useStorage } from '@/core/hooks/useStorage'
import { cn } from '@/core/utils/cn'
import styles from './ImageUpload.module.css'

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void
  onRemove?: () => void
  folder?: string
  defaultUrl?: string | null
  className?: string
}

export function ImageUpload({
  onUploadSuccess,
  onRemove,
  folder = 'general',
  defaultUrl = null,
  className,
}: ImageUploadProps) {
  const { uploadImage, uploading, error } = useStorage()
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultUrl)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleUpload(e.target.files[0])
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async (file: File) => {
    // Quick local preview for instant feedback
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    
    const url = await uploadImage(file, folder)
    if (url) {
      setPreviewUrl(url)
      onUploadSuccess(url)
    } else {
      // If upload fails, revert the preview
      setPreviewUrl(defaultUrl)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewUrl(null)
    if (onRemove) onRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn(styles.container, className)}>
      <div 
        className={cn(
          styles.uploadArea, 
          dragActive && styles.dragActive,
          previewUrl && styles.hasPreview
        )}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className={styles.input}
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {uploading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>Uploading...</span>
          </div>
        )}

        {previewUrl ? (
          <div className={styles.preview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={previewUrl} 
              alt="Upload preview" 
              className={styles.previewImage} 
            />
            {!uploading && (
              <button 
                type="button"
                className={styles.removeBtn} 
                onClick={handleRemove}
                aria-label="Remove image"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <>
            <span className={styles.icon}>📸</span>
            <span className={styles.text}>Tap or drag to upload photo</span>
          </>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}
