import { Download, Copy, Check, Loader2, Calendar, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { schedulePostAction } from '@/app/actions/post'

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
  fallbackLogoUrl,
  agentId
}: { 
  result: GraphicDesignResult | string
  fallbackLogoUrl?: string | null
  agentId?: string
}) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState(true);

  // Scheduling States
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("Instagram");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

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

    // Helper to ensure text contrast (if brand color is too light, fallback to dark slate)
    const getDarkTextColor = (hex: string): string => {
      if (!hex || !hex.startsWith('#')) return '#1e293b';
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return luma > 180 ? '#0f172a' : hex;
    }
    const textColorToUse = getDarkTextColor(primary);

    // Helper to draw images proportionally (fixes logo distortion)
    const drawImageProportional = (url: string, containerX: number, containerY: number, containerW: number, containerH: number) => {
      return new Promise<void>((resolve) => {
        const img = new Image()
        if (url.startsWith('http')) {
          img.crossOrigin = 'anonymous'
        }
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
        if (url.startsWith('http')) {
          img.crossOrigin = 'anonymous'
        }
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

    const drawPremiumText = (text: string, x: number, y: number, fontStr: string, alignRight = false) => {
       ctx.font = fontStr
       ctx.textAlign = alignRight ? 'right' : 'left'
       ctx.textBaseline = 'alphabetic'
       ctx.fillStyle = textColorToUse
       ctx.fillText(text, x, y)
    }

    const drawTextWrapped = (text: string, startX: number, startY: number, maxWidth: number, fontStr: string, lineHeight: number, alignRight = false) => {
      const words = text.split(' ')
      let line = ''
      let currentY = startY

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        ctx.font = fontStr
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && i > 0) {
          drawPremiumText(line.trim(), startX, currentY, fontStr, alignRight)
          line = words[i] + ' '
          currentY += lineHeight
        } else {
          line = testLine
        }
      }
      drawPremiumText(line.trim(), startX, currentY, fontStr, alignRight)
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
      // 1. Solid Textured Background (Corporate Brand Color lightened dynamically to a premium pastel shade)
      ctx.fillStyle = primary
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add a semi-transparent white overlay to dynamically convert the brand color into a soft pastel background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
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
        ctx.fillStyle = textColorToUse
        ctx.font = 'bold 36px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('AACOM SEGUROS', canvas.width / 2, footerY + footerH / 2)
      }

      // 3. Template Layouts matching Marblism
      if (templateId === 0) {
        // TEMPLATE 0: Subject on the right, large left text (e.g. El Mercado del 7%)
        
        // Subject (Persona / Recorte)
        await drawImage(result.transparentUrl, 440, 80, 640, 850, true)

        // Dynamic title font size based on length to prevent vertical stacking
        const titleFontSize = safeCopyText.length > 25 ? '54px' : (safeCopyText.length > 15 ? '64px' : '72px');
        const titleLineH = safeCopyText.length > 25 ? 65 : (safeCopyText.length > 15 ? 75 : 85);
        const titleFont = `900 ${titleFontSize} sans-serif`;

        // Text rendering on the left
        const nextY = drawTextWrapped(safeCopyText.toUpperCase(), 80, 220, 480, titleFont, titleLineH)

        // Draw horizontal divider line
        const dividerY = nextY + 20
        ctx.strokeStyle = textColorToUse
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(80, dividerY)
        ctx.lineTo(380, dividerY)
        ctx.stroke()

        // Subtitle (clean small font size, wraps correctly, no overlap)
        if (safeSubtitle) {
          const subtitleFont = '600 36px sans-serif'
          drawTextWrapped(safeSubtitle.toUpperCase(), 80, dividerY + 70, 480, subtitleFont, 45)
        }

      } else if (templateId === 1) {
        // TEMPLATE 1: Subject centered, custom overlay badges
        
        // Center Subject
        await drawImage(result.transparentUrl, 140, 140, 800, 800, true)

        // Dynamic title font size based on length
        const titleFontSize = safeCopyText.length > 25 ? '54px' : (safeCopyText.length > 15 ? '64px' : '72px');
        const titleLineH = safeCopyText.length > 25 ? 65 : (safeCopyText.length > 15 ? 75 : 85);
        const titleFont = `900 ${titleFontSize} sans-serif`;

        // Title at the top center
        const nextY = drawTextWrapped(safeCopyText.toUpperCase(), canvas.width / 2, 140, 920, titleFont, titleLineH, true)

        if (safeSubtitle) {
          const subtitleFont = '600 36px sans-serif'
          drawTextWrapped(safeSubtitle.toUpperCase(), canvas.width / 2, nextY + 20, 920, subtitleFont, 45, true)
        }

      } else {
        // TEMPLATE 2: Centered Object layout (e.g. Inflación médica vs Tu Retiro)
        
        // Subject (Glass jar with stethoscope)
        await drawImage(result.transparentUrl, 240, 240, 600, 640, true)

        // Dynamic title font size based on length
        const titleFontSize = safeCopyText.length > 25 ? '54px' : (safeCopyText.length > 15 ? '64px' : '72px');
        const titleLineH = safeCopyText.length > 25 ? 65 : (safeCopyText.length > 15 ? 75 : 85);
        const titleFont = `900 ${titleFontSize} sans-serif`;

        // Header bold title
        const nextY = drawTextWrapped(safeCopyText.toUpperCase(), canvas.width / 2, 140, 920, titleFont, titleLineH, true)

        if (safeSubtitle) {
          const subtitleFont = '900 54px sans-serif'
          drawTextWrapped(safeSubtitle.toUpperCase(), canvas.width / 2, footerY - 50, 920, subtitleFont, 65, true)
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

  const handleSchedule = async () => {
    if (!agentId || !scheduledDate || !scheduledTime) return;
    setIsScheduling(true);

    try {
      const scheduledDateTimeStr = `${scheduledDate}T${scheduledTime}:00`;
      const res = await schedulePostAction({
        aiAgentId: agentId,
        content: safeCaption,
        imageUrl: result.transparentUrl || null,
        platform: selectedPlatform,
        scheduledAt: scheduledDateTimeStr
      });
      if (res.success) {
        setScheduledSuccess(true);
      } else {
        alert('Error al programar la publicación: ' + res.error);
      }
    } catch(err: any) {
      alert('Error al programar la publicación: ' + (err.message || err));
    } finally {
      setIsScheduling(false);
    }
  }

  return (
    <div className="mt-4 border border-white/10 bg-white rounded-xl overflow-hidden w-full max-w-sm group relative shadow-2xl">
      {/* Top Image Section (WYSIWYG Preview) */}
      <div className="w-full relative flex flex-col items-center justify-center bg-neutral-100 overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
        {isRenderingPreview || !previewUrl ? (
          <div className="flex flex-col items-center justify-center gap-3 text-neutral-400 p-10 text-center h-[384px]" style={{ aspectRatio: '1 / 1' }}>
            <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
            <span className="text-sm font-medium">Renderizando diseño premium...</span>
          </div>
        ) : (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-full object-contain transition-opacity duration-300"
            style={{ display: 'block', maxHeight: '100%' }}
          />
        )}
      </div>

      {/* Bottom Text Section (Social Media Caption) */}
      <div className="p-5 flex flex-col gap-4">
        <div className="text-neutral-800 text-[15px] leading-relaxed whitespace-pre-wrap font-sans font-normal">
          {safeCaption}
        </div>
        
        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-2">
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
              className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs px-4 py-2.5 rounded-lg transition-colors disabled:opacity-70"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
              {isDownloading ? 'Descargando...' : 'Descargar'}
            </button>
          </div>
          {agentId && (
            <button 
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#41e6db] hover:bg-[#34d3c5] text-neutral-900 font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              Programar publicación
            </button>
          )}
        </div>
      </div>

      {/* Scheduling Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setShowModal(false)
                setScheduledSuccess(false)
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {scheduledSuccess ? (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">¡Publicación Programada!</h3>
                <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                  El diseño ha sido programado con éxito. Recibirás una notificación y recordatorio a la hora indicada.
                </p>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setScheduledSuccess(false)
                  }}
                  className="w-full bg-[#41e6db] hover:bg-[#34d3c5] text-neutral-900 font-bold text-sm py-2.5 rounded-xl transition-colors"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-white font-bold text-lg">Programar Publicación</h3>
                  <p className="text-neutral-400 text-xs mt-1">
                    Elige la plataforma y la hora para que tu asistente notifique la publicación.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-neutral-300 text-xs font-semibold">Plataforma</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#41e6db]"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="X">Twitter / X</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-neutral-300 text-xs font-semibold">Fecha</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#41e6db] scheme-dark"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-neutral-300 text-xs font-semibold">Hora</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#41e6db] scheme-dark"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSchedule}
                  disabled={isScheduling || !scheduledDate || !scheduledTime}
                  className="w-full flex items-center justify-center gap-2 bg-[#41e6db] hover:bg-[#34d3c5] text-neutral-900 font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 mt-2 shadow-lg"
                >
                  {isScheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  Programar Post
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
