'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/core/supabase/client'

export function useStorage() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = useCallback(async (file: File, folder: string = 'general'): Promise<string | null> => {
    try {
      setUploading(true)
      setError(null)

      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${crypto.randomUUID()}.${fileExt}`

      const { data, error: uploadError } = await supabase.storage
        .from('web4neo-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage
        .from('web4neo-images')
        .getPublicUrl(fileName)

      return publicUrlData.publicUrl

    } catch (err: any) {
      setError(err.message || 'Error uploading image')
      console.error('Upload error:', err)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  return { uploadImage, uploading, error }
}
