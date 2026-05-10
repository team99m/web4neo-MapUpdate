/**
 * Client-side Image Compression Pipeline (WDD §13)
 *
 * Flow: File → Canvas resize → WebP blob
 * Max dimensions: 1200×1200px (maintain aspect ratio)
 * Quality: 0.82 WebP
 * Max input size: 5MB
 */

export interface CompressedImage {
  blob: Blob
  width: number
  height: number
  originalSize: number
  compressedSize: number
}

const MAX_DIMENSION = 1200
const QUALITY = 0.82
const MAX_INPUT_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Compress an image file to WebP format.
 * @throws Error if file exceeds MAX_INPUT_SIZE
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  if (file.size > MAX_INPUT_SIZE) {
    throw new Error(`Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${MAX_INPUT_SIZE / 1024 / 1024}MB)`)
  }

  const bitmap = await createImageBitmap(file)
  const { width, height } = calculateDimensions(bitmap.width, bitmap.height)

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await canvas.convertToBlob({
    type: 'image/webp',
    quality: QUALITY,
  })

  return {
    blob,
    width,
    height,
    originalSize: file.size,
    compressedSize: blob.size,
  }
}

/**
 * Compress multiple image files.
 */
export async function compressImages(files: File[]): Promise<CompressedImage[]> {
  return Promise.all(files.map(compressImage))
}

function calculateDimensions(origWidth: number, origHeight: number): { width: number; height: number } {
  if (origWidth <= MAX_DIMENSION && origHeight <= MAX_DIMENSION) {
    return { width: origWidth, height: origHeight }
  }

  const ratio = Math.min(MAX_DIMENSION / origWidth, MAX_DIMENSION / origHeight)
  return {
    width: Math.round(origWidth * ratio),
    height: Math.round(origHeight * ratio),
  }
}

/**
 * Compress and crop an image specifically for avatars (256x256).
 */
export async function compressAvatar(file: File): Promise<CompressedImage> {
  if (file.size > MAX_INPUT_SIZE) {
    throw new Error(`Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${MAX_INPUT_SIZE / 1024 / 1024}MB)`)
  }

  const bitmap = await createImageBitmap(file)
  const size = Math.min(bitmap.width, bitmap.height)
  const startX = (bitmap.width - size) / 2
  const startY = (bitmap.height - size) / 2

  const canvas = new OffscreenCanvas(256, 256)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  // Draw exactly the center square of the original image, scaling it down to 256x256
  ctx.drawImage(bitmap, startX, startY, size, size, 0, 0, 256, 256)
  bitmap.close()

  const blob = await canvas.convertToBlob({
    type: 'image/webp',
    quality: QUALITY,
  })

  return {
    blob,
    width: 256,
    height: 256,
    originalSize: file.size,
    compressedSize: blob.size,
  }
}
