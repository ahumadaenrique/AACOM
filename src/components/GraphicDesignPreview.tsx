import { Download, Copy, Check, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface GraphicDesignResult {
  transparentUrl: string
  copyText: string
  subtitle: string
  socialMediaCaption?: string | null
  backgroundData?: string | null
  brandPrimaryColor: string
  brandSecondaryColor?: string | null
  brandLogo: string | null
  industry: string
}

export function GraphicDesignPreview({ 
  result, 
  fallbackLogoUrl 
}: { 
  result: GraphicDesignResult | string
  fallbackLogoUrl?: string | null
}) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState(true);

  if (!result) return null;
  if (typeof result === 'string') {
    return (
      <div className="mt-4 border border-red-500/20 bg-red-500/10 text-red-400 p-4 rounded-xl text-sm w-full max-w-sm">
        ⚠️ {result}
      </div>
    )
  }

  const primary = result.brandPrimaryColor || '#0f172a'
  const secondary = result.brandSecondaryColor || '#1e293b'
  const safeCopyText = result.copyText || 'Diseño Publicitario';
  const safeSubtitle = result.subtitle || '';
  const safeCaption = result.socialMediaCaption || '¡Contáctanos hoy mismo para asegurar tu futuro! 🛡️💼 #Seguros';
  const safeBgData = result.backgroundData || '';
  const logoToUse = result.brandLogo || fallbackLogoUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(safeCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    
    // Standard square post 1080x1080
    canvas.width = 1080
    canvas.height = 1080

    // Deterministic template based on text length
    const templateId = safeCopyText.length % 3;

    // Helper to draw images proportionally (fixes logo distortion)
    const drawImageProportional = (url: string, containerX: number, containerY: number, containerW: number, containerH: number) => {
      return new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const imgRatio = img.width / img.height
          const containerRatio = containerW / containerH
          let finalW, finalH, finalX, finalY

          if (imgRatio > containerRatio) {
            finalW = containerW
            finalH = containerW / imgRatio
          } else {
            finalH = containerH
            finalW = containerH * imgRatio
          }

          finalX = containerX + (containerW - finalW) / 2
          finalY = containerY + (containerH - finalH) / 2

          ctx.drawImage(img, finalX, finalY, finalW, finalH)
          resolve()
        }
        img.onerror = () => resolve() // Resolve on error so we don't break the entire canvas
        img.src = url.startsWith('http') ? `/api/agents/proxy-image?url=${encodeURIComponent(url)}&t=${Date.now()}` : url
      })
    }

    // Standard draw helper with aspect-ratio protection (prevents squishing) and sticker outline effect
    const drawImage = (url: string, x: number, y: number, w: number, h: number, drawBorder = true) => {
      return new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          // Calculate scale keeping aspect ratio and fitting the target width/height
          const imgRatio = img.width / img.height
          const targetRatio = w / h
          let drawW = w
          let drawH = h
          
          if (imgRatio > targetRatio) {
            // Image is wider, adjust height
            drawH = w / imgRatio
          } else {
            // Image is taller, adjust width
            drawW = h * imgRatio
          }
          
          // Center the image within its bounds
          const drawX = x + (w - drawW) / 2
          const drawY = y + (h - drawH)

          if (drawBorder) {
            // High-performance sticker outline using GPU-accelerated canvas offset
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = drawW
            tempCanvas.height = drawH
            const tCtx = tempCanvas.getContext('2d')
            if (tCtx) {
              // 1. Draw original scaled image onto offscreen canvas
              tCtx.drawImage(img, 0, 0, drawW, drawH)
              
              // 2. Tint it solid white
              tCtx.globalCompositeOperation = 'source-in'
              tCtx.fillStyle = '#ffffff'
              tCtx.fillRect(0, 0, drawW, drawH)
              
              // 3. Draw the white silhouette offset in 16 directions to create a smooth outline
              ctx.save()
              ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
              ctx.shadowBlur = 20
              ctx.shadowOffsetY = 12
              
              const borderSize = 16 // Sticker border thickness
              const steps = 16
              for (let i = 0; i < steps; i++) {
                const angle = (i / steps) * Math.PI * 2
                const ox = Math.cos(angle) * borderSize
                const oy = Math.sin(angle) * borderSize
                ctx.drawImage(tempCanvas, drawX + ox, drawY + oy)
              }
              ctx.restore()
            }
          }
          
          ctx.drawImage(img, drawX, drawY, drawW, drawH)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = url.startsWith('http') ? `/api/agents/proxy-image?url=${encodeURIComponent(url)}&t=${Date.now()}` : url
      })
    }

    const drawPremiumText = (text: string, x: number, y: number, isSubtitle = false, alignRight = false) => {
       ctx.font = isSubtitle ? '600 45px sans-serif' : '900 85px sans-serif'
       ctx.textAlign = alignRight ? 'right' : 'left'
       ctx.textBaseline = 'alphabetic'
       
       // Premium Text Glow (instead of solid boxes)
       ctx.shadowColor = 'rgba(0,0,0,0.85)'
       ctx.shadowBlur = 40
       ctx.shadowOffsetY = 15
       
       // White text looks best on complex gradients
       ctx.fillStyle = '#ffffff'
       
       // Multiple fill passes for extreme legibility over complex backgrounds
       ctx.fillText(text, x, y)
       
       // Sharp tight shadow for edge clarity
       ctx.shadowBlur = 5
       ctx.shadowOffsetY = 2
       ctx.fillText(text, x, y)
       ctx.fillText(text, x, y) // Double hit for thickness
       
       // Reset shadows
       ctx.shadowBlur = 0
       ctx.shadowOffsetY = 0
    }

    const drawTextWrapped = (text: string, startX: number, startY: number, maxWidth: number, isSubtitle: boolean, alignRight = false) => {
      ctx.font = isSubtitle ? '600 45px sans-serif' : '900 85px sans-serif'
      const words = text.split(' ')
      let line = ''
      let currentY = startY
      const lineHeight = isSubtitle ? 60 : 100

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && i > 0) {
          drawPremiumText(line.trim(), startX, currentY, isSubtitle, alignRight)
          line = words[i] + ' '
          currentY += lineHeight
        } else {
          line = testLine
        }
      }
      drawPremiumText(line.trim(), startX, currentY, isSubtitle, alignRight)
      return currentY + lineHeight
    }

    const drawCrumpledPaperTexture = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // 1. General paper fiber/noise overlay
      ctx.fillStyle = 'rgba(0,0,0,0.015)'
      for (let i = 0; i < 30000; i++) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5)
      }
      ctx.fillStyle = 'rgba(255,255,255,0.01)'
      for (let i = 0; i < 30000; i++) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5)
      }

      // 2. Creases/folds mapping
      const numCreases = 10
      for (let i = 0; i < numCreases; i++) {
        const x1 = Math.random() * w
        const y1 = Math.random() * h
        const x2 = Math.random() * w
        const y2 = Math.random() * h

        const angle = Math.atan2(y2 - y1, x2 - x1)
        const perpAngle = angle + Math.PI / 2
        
        ctx.lineWidth = 1.5

        // Dark crease side
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = Math.cos(perpAngle) * 5
        ctx.shadowOffsetY = Math.sin(perpAngle) * 5

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Light crease side
        ctx.shadowColor = 'rgba(255, 255, 255, 0.18)'
        ctx.shadowBlur = 8
        ctx.shadowOffsetX = -Math.cos(perpAngle) * 3
        ctx.shadowOffsetY = -Math.sin(perpAngle) * 3

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // Reset shadows
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }

    try {
      // 1. Solid Textured Background (Verde claro / Menta corporativo texturizado)
      // We read primary from branding, but if it is too dark, we can use a soft pastel variant for the aesthetic or use secondary.
      // Marblism uses a soft pastel green background. Let's make a beautiful pastel overlay base.
      ctx.fillStyle = primary
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add a soft tint overlay to match the premium mint/green hue from the user's reference images
      ctx.fillStyle = 'rgba(212, 237, 228, 0.85)' // Warm mint pastel overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw the premium Crumpled Paper Texture
      drawCrumpledPaperTexture(ctx, canvas.width, canvas.height)

      // 2. Render Footer Band (White Solid bar with centered Logo & Text)
      const footerH = 150
      const footerY = canvas.height - footerH
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, footerY, canvas.width, footerH)
      
      // Bottom border divider for footer clarity
      ctx.fillStyle = '#eaeaea'
      ctx.fillRect(0, footerY, canvas.width, 3)

      if (logoToUse) {
        // Center the Logo with company brand checkmark
        const lw = 440, lh = 90
        const lx = (canvas.width - lw) / 2
        const ly = footerY + (footerH - lh) / 2
        await drawImageProportional(logoToUse, lx, ly, lw, lh)
      } else {
        // Text fallback
        ctx.fillStyle = '#0f172a'
        ctx.font = 'bold 36px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('AACOM SEGUROS', canvas.width / 2, footerY + footerH / 2)
      }

      // 3. Template Layouts matching Marblism
      if (templateId === 0) {
        // TEMPLATE 0: Subject on the right, large left text (e.g. El Mercado del 7%)
        
        // Subject (Persona / Recorte)
        // Set no shadow, clear aspect ratio protection
        await drawImage(result.transparentUrl, 420, 80, 680, 850, true)

        // Text rendering on the left
        ctx.textAlign = 'left'
        ctx.fillStyle = '#1e293b' // Deep charcoal for professional contrast

        // Title Wrapped
        ctx.font = '900 72px sans-serif'
        const words = safeCopyText.toUpperCase().split(' ')
        let line = ''
        let currentY = 220
        const lineH = 85

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' '
          const metrics = ctx.measureText(testLine)
          if (metrics.width > 480 && i > 0) {
            ctx.fillText(line.trim(), 80, currentY)
            line = words[i] + ' '
            currentY += lineH
          } else {
            line = testLine
          }
        }
        ctx.fillText(line.trim(), 80, currentY)

        // Draw horizontal divider line
        const dividerY = currentY + 40
        ctx.strokeStyle = '#1e293b'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(80, dividerY)
        ctx.lineTo(480, dividerY)
        ctx.stroke()

        // Subtitle
        if (safeSubtitle) {
          ctx.fillStyle = '#1e293b'
          ctx.font = '900 64px sans-serif'
          drawTextWrapped(safeSubtitle.toUpperCase(), 80, dividerY + 110, 480, false)
        }

      } else if (templateId === 1) {
        // TEMPLATE 1: Subject centered, custom overlay badges
        
        // Center Subject
        await drawImage(result.transparentUrl, 140, 140, 800, 800, true)

        // Title at the top center
        ctx.textAlign = 'center'
        ctx.fillStyle = '#1e293b'
        ctx.font = '900 68px sans-serif'
        
        const words = safeCopyText.toUpperCase().split(' ')
        let line = ''
        let currentY = 130
        const lineH = 80

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' '
          if (ctx.measureText(testLine).width > 900 && i > 0) {
            ctx.fillText(line.trim(), canvas.width / 2, currentY)
            line = words[i] + ' '
            currentY += lineH
          } else {
            line = testLine
          }
        }
        ctx.fillText(line.trim(), canvas.width / 2, currentY)

        if (safeSubtitle) {
          ctx.font = '600 36px sans-serif'
          ctx.fillStyle = '#4b5563'
          ctx.fillText(safeSubtitle, canvas.width / 2, currentY + 60)
        }

      } else {
        // TEMPLATE 2: Centered Object layout (e.g. Inflación médica vs Tu Retiro)
        
        // Subject (Glass jar with stethoscope)
        await drawImage(result.transparentUrl, 240, 240, 600, 640, true)

        // Header bold title
        ctx.textAlign = 'center'
        ctx.fillStyle = '#1e293b'
        ctx.font = '900 78px sans-serif'

        const words = safeCopyText.toUpperCase().split(' ')
        let line = ''
        let currentY = 140
        const lineH = 90

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' '
          if (ctx.measureText(testLine).width > 960 && i > 0) {
            ctx.fillText(line.trim(), canvas.width / 2, currentY)
            line = words[i] + ' '
            currentY += lineH
          } else {
            line = testLine
          }
        }
        ctx.fillText(line.trim(), canvas.width / 2, currentY)

        if (safeSubtitle) {
          ctx.font = '900 64px sans-serif'
          ctx.fillStyle = '#1e293b'
          ctx.fillText(safeSubtitle.toUpperCase(), canvas.width / 2, footerY - 50)
        }
      }

      return canvas;
    } catch(err) {
      console.error(err)
      return null
    }
  }

  useEffect(() => {
    let isMounted = true;
    const renderPreview = async () => {
      setIsRenderingPreview(true);
      const canvas = await generateCanvas();
      if (isMounted && canvas) {
        setPreviewUrl(canvas.toDataURL('image/png'));
      }
      if (isMounted) {
        setIsRenderingPreview(false);
      }
    }
    renderPreview();
    return () => { isMounted = false; }
  }, [result, primary, secondary, safeCopyText, safeSubtitle, safeBgData, logoToUse]);

  const handleDownload = () => {
    if (isDownloading || !previewUrl) return;
    setIsDownloading(true);

    try {
      const a = document.createElement('a')
      a.href = previewUrl
      a.download = `Publicacion_${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch(err: any) {
      alert('Error al descargar la imagen: ' + (err.message || err))
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="mt-4 border border-white/10 bg-white rounded-xl overflow-hidden w-full max-w-sm group relative shadow-2xl">
      {/* Top Image Section (WYSIWYG Preview) */}
      <div className="w-full aspect-square relative flex flex-col items-center justify-center bg-neutral-100 overflow-hidden">
        {isRenderingPreview || !previewUrl ? (
          <div className="flex flex-col items-center justify-center gap-3 text-neutral-400 p-10 text-center h-[384px]">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
            <span className="text-sm font-medium">Renderizando diseño premium...</span>
          </div>
        ) : (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        )}
      </div>

      {/* Bottom Text Section (Social Media Caption) */}
      <div className="p-5 flex flex-col gap-4">
        <div className="text-neutral-800 text-[15px] leading-relaxed whitespace-pre-wrap font-sans font-normal">
          {safeCaption}
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
          <button 
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs px-4 py-2.5 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />} 
            {copied ? 'Copiado!' : 'Copiar texto'}
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading || isRenderingPreview || !previewUrl}
            className="flex-1 flex items-center justify-center gap-2 bg-[#41e6db] hover:bg-[#34d3c5] text-neutral-900 font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-70"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
            {isDownloading ? 'Descargando...' : 'Descargar'}
          </button>
        </div>
      </div>
    </div>
  )
}
