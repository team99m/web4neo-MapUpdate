'use client'

import { useState } from 'react'
import { ImageUpload } from '@/core/components/ImageUpload'
import { useAuth } from '@/core/auth/useAuth'
import { AuthGuard } from '@/core/auth/AuthGuard'
import { useToast } from '@/app/providers'

export default function StorageTestPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])

  const handleUploadSuccess = (url: string) => {
    setUploadedUrls((prev) => [...prev, url])
    toast('Image uploaded successfully!', 'success')
  }

  return (
    <AuthGuard>
      <div className="page-container" style={{ padding: '24px' }}>
        <h1 style={{ marginBottom: '8px' }}>Storage Test Environment</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
          Upload images here to test the Supabase Storage integration before deploying it to the main forms.
        </p>

        <div style={{ maxWidth: '400px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Upload New Image</h2>
          <ImageUpload 
            onUploadSuccess={handleUploadSuccess} 
            folder={`test/${user?.id || 'anonymous'}`}
          />
        </div>

        {uploadedUrls.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Uploaded Images Registry</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {uploadedUrls.map((url, i) => (
                <div key={i} style={{ 
                  padding: '16px', 
                  backgroundColor: 'var(--color-bg-secondary)', 
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ color: 'var(--color-primary)', wordBreak: 'break-all', fontSize: '14px' }}
                  >
                    {url}
                  </a>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={url} 
                    alt={`Uploaded ${i}`} 
                    style={{ height: '100px', width: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
