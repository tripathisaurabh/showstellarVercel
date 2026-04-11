export type ImageCropGeometry = {
  frameWidth: number
  frameHeight: number
  naturalWidth: number
  naturalHeight: number
  offsetX: number
  offsetY: number
  zoom: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to read the selected image'))
    }

    image.src = objectUrl
  })
}

export async function createCroppedImageBlob(file: File, geometry: ImageCropGeometry) {
  const image = await loadImageFromFile(file)
  const baseScale = Math.max(geometry.frameWidth / geometry.naturalWidth, geometry.frameHeight / geometry.naturalHeight)
  const scale = baseScale * geometry.zoom
  const displayWidth = geometry.naturalWidth * scale
  const displayHeight = geometry.naturalHeight * scale

  const left = (geometry.frameWidth - displayWidth) / 2 + geometry.offsetX
  const top = (geometry.frameHeight - displayHeight) / 2 + geometry.offsetY

  const sourceX = clamp(-left / scale, 0, geometry.naturalWidth)
  const sourceY = clamp(-top / scale, 0, geometry.naturalHeight)
  const sourceW = Math.min(geometry.frameWidth / scale, geometry.naturalWidth - sourceX)
  const sourceH = Math.min(geometry.frameHeight / scale, geometry.naturalHeight - sourceY)

  if (sourceW <= 0 || sourceH <= 0) {
    throw new Error('Unable to crop the selected image')
  }

  const outputWidth = 1200
  const outputHeight = Math.round(outputWidth * (geometry.frameHeight / geometry.frameWidth))

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to prepare the image for upload')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, outputWidth, outputHeight)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, outputWidth, outputHeight)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      result => {
        if (result) {
          resolve(result)
          return
        }

        reject(new Error('Unable to optimize the cropped image'))
      },
      'image/jpeg',
      0.88
    )
  })

  return { blob, width: outputWidth, height: outputHeight }
}

export async function readImageDimensions(file: File) {
  const image = await loadImageFromFile(file)
  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
  }
}
