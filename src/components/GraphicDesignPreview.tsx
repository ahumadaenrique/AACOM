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

    // Standard draw helper
    const drawImage = (url: string, x: number, y: number, w: number, h: number) => {
      return new Promise<void>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.drawImage(img, x, y, w, h)
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

    try {
      if (templateId === 0) {
        // TEMPLATE 0: Marblism Mesh Gradient (Ultra Premium)
        
        // Base color
        ctx.fillStyle = primary
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Complex Mesh Gradients
        const orb1 = ctx.createRadialGradient(0, 0, 100, 0, 0, 1000)
        orb1.addColorStop(0, secondary)
        orb1.addColorStop(1, 'transparent')
        ctx.fillStyle = orb1
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const orb2 = ctx.createRadialGradient(canvas.width, canvas.height, 100, canvas.width, canvas.height, 1200)
        orb2.addColorStop(0, '#ffffff40')
        orb2.addColorStop(1, 'transparent')
        ctx.fillStyle = orb2
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        if (safeBgData) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
          ctx.font = '900 400px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(safeBgData, canvas.width / 2, canvas.height / 2.2, canvas.width - 80)
        }

        // Person with soft glow
        ctx.shadowColor = 'rgba(255,255,255,0.1)'
        ctx.shadowBlur = 40
        ctx.shadowOffsetY = 0
        await drawImage(result.transparentUrl, 100, 180, 880, 880)
        
        // Dark drop shadow behind person
        ctx.shadowColor = 'rgba(0,0,0,0.6)'
        ctx.shadowBlur = 60
        ctx.shadowOffsetY = 30
        await drawImage(result.transparentUrl, 100, 180, 880, 880)
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0
        
        // Text Overlays
        const nextY = drawTextWrapped(safeCopyText, 80, 150, 900, false)
        if (safeSubtitle) {
          drawTextWrapped(safeSubtitle, 80, nextY + 15, 900, true)
        }

        // True Glassmorphism Logo Pill
        if (logoToUse) {
          const pw = 400, ph = 120, px = canvas.width - pw - 60, py = canvas.height - ph - 60
          
          // Glass Shadow
          ctx.shadowColor = 'rgba(0,0,0,0.25)'
          ctx.shadowBlur = 30
          ctx.shadowOffsetY = 15
          
          // Glass Fill
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
          ctx.beginPath()
          ctx.roundRect(px, py, pw, ph, 60)
          ctx.fill()
          
          // Glass Stroke
          ctx.shadowColor = 'transparent'
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
          ctx.lineWidth = 1.5
          ctx.stroke()
          
          await drawImageProportional(logoToUse, px + 30, py + 20, pw - 60, ph - 40)
        }

      } else if (templateId === 1) {
        // TEMPLATE 1: Dark Editorial (Moody & Elegant)
        ctx.fillStyle = '#0a0a0a' // Almost black
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Subtle spotlight
        const spot = ctx.createRadialGradient(canvas.width/2, canvas.height/3, 50, canvas.width/2, canvas.height/2, 900)
        spot.addColorStop(0, primary)
        spot.addColorStop(1, 'transparent')
        ctx.fillStyle = spot
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Noise overlay
        ctx.fillStyle = 'rgba(255,255,255,0.03)'
        for (let i = 0; i < 15000; i++) {
          ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 1.5)
        }

        if (safeBgData) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
          ctx.font = '900 350px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(safeBgData, canvas.width / 2, canvas.height / 2.2, canvas.width - 100)
        }

        // Very harsh shadow for dramatic editorial effect
        ctx.shadowColor = 'rgba(0,0,0,0.9)'
        ctx.shadowBlur = 50
        ctx.shadowOffsetY = 40
        await drawImage(result.transparentUrl, 100, 220, 880, 880)
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0

        // Text centered at top
        ctx.textAlign = 'center'
        const words = safeCopyText.split(' ')
        let line = ''
        let currentY = 160
        ctx.font = '900 85px sans-serif'
        ctx.fillStyle = '#ffffff'
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' '
          if (ctx.measureText(testLine).width > 900 && i > 0) {
            ctx.shadowColor = 'rgba(0,0,0,0.8)'
            ctx.shadowBlur = 20
            ctx.fillText(line.trim(), canvas.width/2, currentY)
            line = words[i] + ' '
            currentY += 100
          } else {
            line = testLine
          }
        }
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 20
        ctx.fillText(line.trim(), canvas.width/2, currentY)
        
        if (safeSubtitle) {
          ctx.font = '600 45px sans-serif'
          ctx.fillStyle = 'rgba(255,255,255,0.8)'
          ctx.fillText(safeSubtitle, canvas.width/2, currentY + 70, 950)
        }

        if (logoToUse) {
          const pw = 300, ph = 100, px = (canvas.width - pw)/2, py = canvas.height - ph - 50
          await drawImageProportional(logoToUse, px, py, pw, ph)
        }
        
      } else {
        // TEMPLATE 2: Dynamic Diagonal Split (Modern Startup)
        ctx.fillStyle = secondary
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw diagonal polygon
        ctx.fillStyle = primary
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(canvas.width, 0)
        ctx.lineTo(canvas.width, canvas.height * 0.4)
        ctx.lineTo(0, canvas.height * 0.7)
        ctx.closePath()
        ctx.fill()
        
        // Diagonal glow line
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'
        ctx.lineWidth = 10
        ctx.beginPath()
        ctx.moveTo(0, canvas.height * 0.7)
        ctx.lineTo(canvas.width, canvas.height * 0.4)
        ctx.stroke()

        if (safeBgData) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
          ctx.font = '900 350px sans-serif'
          ctx.textAlign = 'right'
          ctx.textBaseline = 'middle'
          ctx.fillText(safeBgData, canvas.width - 50, canvas.height * 0.85, canvas.width - 100)
        }

        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = 50
        ctx.shadowOffsetY = 30
        await drawImage(result.transparentUrl, 50, 180, 980, 980)
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0

        // Right aligned text
        const nextY = drawTextWrapped(safeCopyText, canvas.width - 60, 140, 850, false, true)
        if (safeSubtitle) {
          drawTextWrapped(safeSubtitle, canvas.width - 60, nextY + 15, 850, true, true)
        }

        if (logoToUse) {
          const pw = 350, ph = 120, px = 50, py = canvas.height - ph - 50
          
          // Solid white rounded rect for logo contrast
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = 'rgba(0,0,0,0.2)'
          ctx.shadowBlur = 20
          ctx.beginPath()
          ctx.roundRect(px, py, pw, ph, 30)
          ctx.fill()
          ctx.shadowBlur = 0
          
          await drawImageProportional(logoToUse, px + 20, py + 20, pw - 40, ph - 40)
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
