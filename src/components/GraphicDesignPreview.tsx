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
        img.onerror = () => resolve() // resolve to avoid crashing the whole render on one failed image
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

    const drawTextMarblism = (text: string, x: number, y: number, isSubtitle = false, useDark = false) => {
       ctx.font = isSubtitle ? 'bold 45px sans-serif' : '900 85px sans-serif'
       const metrics = ctx.measureText(text)
       const textWidth = metrics.width
       const textHeight = isSubtitle ? 45 : 85
       
       // Solid highlight behind text
       ctx.fillStyle = useDark ? 'rgba(0,0,0,0.85)' : '#ffffff'
       const paddingX = 20
       const paddingY = 20
       ctx.beginPath()
       ctx.roundRect(x - paddingX, y - textHeight, textWidth + (paddingX*2), textHeight + (paddingY*2), 15)
       ctx.fill()

       // Text
       ctx.fillStyle = useDark ? '#ffffff' : primary
       ctx.textAlign = 'left'
       ctx.textBaseline = 'alphabetic'
       ctx.fillText(text, x, y + (paddingY / 2))
    }

    const drawDynamicText = (useDark: boolean) => {
      const words = safeCopyText.split(' ')
      let line = ''
      let yPos = 140
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        ctx.font = '900 85px sans-serif'
        const metrics = ctx.measureText(testLine)
        if (metrics.width > 800 && i > 0) {
          drawTextMarblism(line.trim(), 80, yPos, false, useDark)
          line = words[i] + ' '
          yPos += 110
        } else {
          line = testLine
        }
      }
      drawTextMarblism(line.trim(), 80, yPos, false, useDark)

      if (safeSubtitle) {
        drawTextMarblism(safeSubtitle, 80, yPos + 100, true, !useDark)
      }
    }

    try {
      if (templateId === 0) {
        // TEMPLATE 0: Marblism Glass (Radial gradient, white outline, glass pill logo)
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, primary)
        gradient.addColorStop(1, secondary)
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        const overlay = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, 800)
        overlay.addColorStop(0, '#ffffff15')
        overlay.addColorStop(1, '#00000040')
        ctx.fillStyle = overlay
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        if (safeBgData) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
          ctx.font = 'bold 350px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(safeBgData, canvas.width / 2, canvas.height / 2.2)
        }

        // White outline
        ctx.shadowColor = 'white'
        ctx.shadowBlur = 0
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          await drawImage(result.transparentUrl, 100 + (Math.cos(angle)*12), 200 + (Math.sin(angle)*12), 880, 880)
        }
        // Person
        ctx.shadowColor = 'rgba(0,0,0,0.3)'
        ctx.shadowBlur = 20
        ctx.shadowOffsetY = 15
        await drawImage(result.transparentUrl, 100, 200, 880, 880)

        // Texts
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0
        drawDynamicText(false)

        // Logo Pill
        if (logoToUse) {
          const pw = 480, ph = 140, px = canvas.width - pw - 40, py = canvas.height - ph - 40
          ctx.shadowColor = 'rgba(0,0,0,0.15)'
          ctx.shadowBlur = 20
          ctx.shadowOffsetY = 10
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.roundRect(px, py, pw, ph, 70)
          ctx.fill()
          ctx.shadowBlur = 0
          await drawImageProportional(logoToUse, px + 30, py + 20, pw - 60, ph - 40)
        }

      } else if (templateId === 1) {
        // TEMPLATE 1: Textured Paper (Solid color with noise overlay, free logo)
        ctx.fillStyle = primary
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Fake noise texture
        ctx.fillStyle = 'rgba(255,255,255,0.05)'
        for (let i = 0; i < 5000; i++) {
          ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2)
        }
        ctx.fillStyle = 'rgba(0,0,0,0.05)'
        for (let i = 0; i < 5000; i++) {
          ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2)
        }

        if (safeBgData) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
          ctx.font = 'bold 350px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(safeBgData, canvas.width / 2, canvas.height / 2.2)
        }

        // Logo at top right without pill
        if (logoToUse) {
          const pw = 300, ph = 100, px = canvas.width - pw - 60, py = 60
          // Premium drop shadow
          ctx.shadowColor = 'rgba(0,0,0,0.5)'
          ctx.shadowBlur = 20
          ctx.shadowOffsetY = 10
          await drawImageProportional(logoToUse, px, py, pw, ph)
          ctx.shadowBlur = 0
          ctx.shadowOffsetY = 0
        }

        // Person with drop shadow only (no outline)
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = 30
        ctx.shadowOffsetY = 20
        await drawImage(result.transparentUrl, 100, 200, 880, 880)
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0

        drawDynamicText(true) // Dark text highlights
        
      } else {
        // TEMPLATE 2: Solid Minimalist (Two tone split)
        ctx.fillStyle = primary
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7)
        ctx.fillStyle = secondary
        ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3)

        if (safeBgData) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
          ctx.font = 'bold 350px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(safeBgData, canvas.width / 2, canvas.height / 2.2)
        }

        // Person centered
        ctx.shadowColor = 'rgba(0,0,0,0.4)'
        ctx.shadowBlur = 40
        ctx.shadowOffsetY = 30
        await drawImage(result.transparentUrl, 100, 150, 880, 880)
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0

        drawDynamicText(false)

        // Logo centered at bottom
        if (logoToUse) {
          const pw = 400, ph = 120, px = (canvas.width - pw) / 2, py = canvas.height - ph - 50
          await drawImageProportional(logoToUse, px, py, pw, ph)
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
  }, [result, primary, secondary, safeCopyText, safeSubtitle, logoToUse]);

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
          <div className="flex flex-col items-center justify-center gap-3 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
            <span className="text-sm font-medium">Renderizando diseño...</span>
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
            {isDownloading ? 'Descargando...' : 'Descargar 8k'}
          </button>
        </div>
      </div>
    </div>
  )
}
