'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/core/supabase/client'
import { useAuth } from '@/core/auth/useAuth'
import { CATEGORY_CONFIG } from '@/core/types/issue'
import type { IssueCategory, ReportStep } from '@/core/types/issue'
import { useToast } from '@/app/providers'
import styles from './page.module.css'

const STEPS: { key: ReportStep; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'category', label: 'Category' },
  { key: 'details', label: 'Details' },
  { key: 'review', label: 'Review' },
]

const CATEGORIES = Object.entries(CATEGORY_CONFIG) as [IssueCategory, { label: string; emoji: string }][]

export default function ReportPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const addToast = useToast()
  const [step, setStep] = useState(0)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState<IssueCategory | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  // Init mini map for step 0
  useEffect(() => {
    if (step !== 0) return
    let cancelled = false

    const initMap = async () => {
      const L = await import('leaflet')
      if (cancelled || !mapContainerRef.current) return
      if (mapRef.current) {
        mapRef.current.invalidateSize()
        return
      }

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapContainerRef.current, {
        center: [13.7563, 100.5018],
        zoom: 13,
        zoomControl: false,
      })

      L.control.zoom({ position: 'topright' }).addTo(map)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng
        setLat(clickLat)
        setLng(clickLng)
        if (markerRef.current) markerRef.current.setLatLng(e.latlng)
        else {
          markerRef.current = L.marker(e.latlng).addTo(map)
        }
        reverseGeocode(clickLat, clickLng)
      })

      mapRef.current = map
      if (lat && lng) {
        const pos = L.latLng(lat, lng)
        map.setView(pos, 15)
        markerRef.current = L.marker(pos).addTo(map)
      }
    }

    const timer = setTimeout(initMap, 100)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
      const data = await res.json()
      setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }
  }

  const detectGPS = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      setLat(latitude)
      setLng(longitude)
      reverseGeocode(latitude, longitude)
      if (mapRef.current) {
        const L = await import('leaflet')
        const latlng = L.latLng(latitude, longitude)
        mapRef.current.setView(latlng, 16)
        if (markerRef.current) markerRef.current.setLatLng(latlng)
        else markerRef.current = L.marker(latlng).addTo(mapRef.current)
      }
    })
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remaining = 5 - photos.length
    const toAdd = files.slice(0, remaining)
    setPhotos((p) => [...p, ...toAdd])
    toAdd.forEach((f) => {
      const url = URL.createObjectURL(f)
      setPreviews((p) => [...p, url])
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canNext = () => {
    if (step === 0) return lat !== null && lng !== null
    if (step === 1) return category !== null
    if (step === 2) return title.trim().length > 0
    return true
  }

  const handleSubmit = async () => {
    if (!user) {
      addToast('You must be logged in to submit a report', 'error')
      return
    }
    if (!lat || !lng) {
      addToast('Please select a location on the map', 'warning')
      setStep(0)
      return
    }
    if (!category) {
      addToast('Please select a category', 'warning')
      setStep(1)
      return
    }
    if (!title.trim()) {
      addToast('Please enter a title', 'warning')
      setStep(2)
      return
    }

    setSubmitting(true)
    try {
      // Upload photos
      const imageUrls: string[] = []
      for (const photo of photos) {
        const ext = photo.name.split('.').pop() || 'webp'
        const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))

        const fileName = `issues/${uuid}.${ext}`

        const { error: upErr } = await supabase.storage
          .from('issue-images')
          .upload(fileName, photo, { cacheControl: '3600', upsert: true })

        if (upErr) {
          console.error('Photo upload failed:', upErr)
          continue
        }

        const { data } = supabase.storage.from('issue-images').getPublicUrl(fileName)
        imageUrls.push(data.publicUrl)
      }

      const { data, error } = await supabase
        .from('issues')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          category,
          lat,
          lng,
          address: address || null,
          images: imageUrls,
          status: 'open',
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        addToast('Report submitted successfully!', 'success')
        router.push(`/map/${data.id}`)
      }
    } catch (err) {
      console.error('Submit error:', err)
      alert('Failed to submit issue. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) return <div className={styles.loading}>Loading…</div>

  const currentStep = STEPS[step]

  return (
    <div className={styles.wizard} id="report-wizard">
      <div className={styles.header}>
        <h1 className={styles.title}>Report an Issue</h1>
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={s.key} className={`${styles.stepDot} ${i === step ? styles.stepDotActive : i < step ? styles.stepDotDone : ''}`} />
          ))}
        </div>
        <div className={styles.stepLabel}>Step {step + 1}: {currentStep.label}</div>
      </div>

      <div className={styles.content}>
        {/* Step 0: Location */}
        {step === 0 && (
          <div className="animate-fade-in">
            <button className={styles.gpsBtn} onClick={detectGPS} id="gps-detect-btn">📍 Auto-detect my location</button>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
            <div ref={mapContainerRef} className={styles.mapMini} id="report-mini-map" />
            <div className={styles.addressBox}>{address || 'Tap the map or use GPS to set location'}</div>
          </div>
        )}

        {/* Step 1: Category */}
        {step === 1 && (
          <div className={`${styles.catGrid} animate-slide-up`}>
            {CATEGORIES.map(([key, cfg]) => (
              <button
                key={key}
                className={`${styles.catCard} ${category === key ? styles.catCardActive : ''}`}
                onClick={() => setCategory(key)}
                id={`cat-${key}`}
              >
                <span className={styles.catEmoji}>{cfg.emoji}</span>
                <span className={styles.catLabel}>{cfg.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Title *</label>
              <input className={styles.fieldInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the issue" maxLength={100} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Description</label>
              <textarea className={`${styles.fieldInput} ${styles.textarea}`} value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} placeholder="Additional details (optional)" />
              <div className={styles.charCount}>{description.length}/500</div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Photos (max 5)</label>
              <div className={styles.photoUpload}>
                {previews.map((url, i) => (
                  <img key={i} src={url} alt={`Preview ${i}`} className={styles.photoThumb} />
                ))}
                {photos.length < 5 && (
                  <button className={styles.addPhotoBtn} onClick={() => fileInputRef.current?.click()}>+</button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoAdd} />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className={`${styles.previewCard} animate-scale-in`}>
            <div className={styles.previewRow}><span className={styles.previewLabel}>Location</span><span>{address || 'Not set'}</span></div>
            <div className={styles.previewRow}><span className={styles.previewLabel}>Category</span><span>{category ? CATEGORY_CONFIG[category].emoji + ' ' + CATEGORY_CONFIG[category].label : '—'}</span></div>
            <div className={styles.previewRow}><span className={styles.previewLabel}>Title</span><span>{title || '—'}</span></div>
            <div className={styles.previewRow}><span className={styles.previewLabel}>Description</span><span>{description || 'None'}</span></div>
            <div className={styles.previewRow}><span className={styles.previewLabel}>Photos</span><span>{photos.length} file(s)</span></div>
            {previews.length > 0 && (
              <div className={styles.previewPhotos}>
                {previews.map((url, i) => <img key={i} src={url} alt="" className={styles.photoThumb} />)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.nav}>
        {step > 0 && <button className={styles.btnSecondary} onClick={() => setStep(step - 1)}>← Back</button>}
        {step < 3 ? (
          <button className={styles.btnPrimary} disabled={!canNext()} onClick={() => setStep(step + 1)}>Next →</button>
        ) : (
          <button className={styles.btnPrimary} disabled={submitting || !canNext()} onClick={handleSubmit}>
            {submitting ? 'Submitting…' : '✓ Submit Report'}
          </button>
        )}
      </div>
    </div>
  )
}
