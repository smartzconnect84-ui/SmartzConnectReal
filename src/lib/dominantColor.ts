/**
 * Extracts the dominant (average) RGB color from an image URL using an offscreen canvas.
 * Falls back to the brand pink (#EC4899) on CORS errors or canvas taint.
 */

const FALLBACK = '#EC4899'
const cache = new Map<string, string>()

export async function getDominantColor(imageUrl: string): Promise<string> {
  if (!imageUrl) return FALLBACK
  if (cache.has(imageUrl)) return cache.get(imageUrl)!

  return new Promise(resolve => {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          const SIZE = 32
          const canvas = document.createElement('canvas')
          canvas.width = SIZE
          canvas.height = SIZE
          const ctx = canvas.getContext('2d')
          if (!ctx) { resolve(FALLBACK); return }

          ctx.drawImage(img, 0, 0, SIZE, SIZE)

          let r = 0, g = 0, b = 0
          const data = ctx.getImageData(0, 0, SIZE, SIZE).data
          const total = SIZE * SIZE

          for (let i = 0; i < data.length; i += 4) {
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
          }

          r = Math.round(r / total)
          g = Math.round(g / total)
          b = Math.round(b / total)

          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
          cache.set(imageUrl, hex)
          resolve(hex)
        } catch {
          // Canvas tainted (CORS) or other draw error
          cache.set(imageUrl, FALLBACK)
          resolve(FALLBACK)
        }
      }

      img.onerror = () => {
        cache.set(imageUrl, FALLBACK)
        resolve(FALLBACK)
      }

      img.src = imageUrl
    } catch {
      resolve(FALLBACK)
    }
  })
}
