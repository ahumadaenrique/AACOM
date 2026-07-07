import { Download, Copy, Check } from 'lucide-react'
import { useState } from 'react'

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

  const handleDownload = () => {
    // We will render it to a canvas and download
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Standard square post 1080x1080
    canvas.width = 1080
    canvas.height = 1080

    // Draw background (gradient)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, primary)
    gradient.addColorStop(1, secondary)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add a simple geometric pattern or gradient overlay for extra premium feel
    const overlayGradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, 800)
    overlayGradient.addColorStop(0, '#ffffff15')
    overlayGradient.addColorStop(1, '#00000040')
    ctx.fillStyle = overlayGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Helper to draw images
    const drawImage = (url: string, x: number, y: number, w: number, h: number) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          ctx.drawImage(img, x, y, w, h)
          resolve()
        }
        img.onerror = () => {
          reject(new Error(`No se pudo cargar la imagen: ${url.substring(0, 50)}...`))
        }
        img.src = url.startsWith('http') ? `/api/agents/proxy-image?url=${encodeURIComponent(url)}&t=${Date.now()}` : url
      })
    }

    const startDrawing = async () => {
      try {
        // Draw Background Data text
        if (safeBgData) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
          ctx.font = 'bold 350px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(safeBgData, canvas.width / 2, canvas.height / 2.2)
        }

        // Draw the person image (centered/bottom aligned)
        // Draw white outline by offsets to create a solid border
        ctx.shadowColor = 'white'
        ctx.shadowBlur = 10
        await drawImage(result.transparentUrl, 96, 200, 880, 880)
        await drawImage(result.transparentUrl, 104, 200, 880, 880)
        await drawImage(result.transparentUrl, 100, 196, 880, 880)
        await drawImage(result.transparentUrl, 100, 204, 880, 880)
        
        // Draw final centered image
        ctx.shadowBlur = 0
        await drawImage(result.transparentUrl, 100, 200, 880, 880)

        // Draw Texts with Shadow for premium feel
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 15
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 5

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 80px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
        
        // Very basic word wrap
        const words = safeCopyText.split(' ')
        let line = ''
        let yPos = 150
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' '
          const metrics = ctx.measureText(testLine)
          if (metrics.width > 900 && i > 0) {
            ctx.fillText(line, 80, yPos)
            line = words[i] + ' '
            yPos += 90
          } else {
            line = testLine
          }
        }
        ctx.fillText(line, 80, yPos)

        // Subtitle
        if (safeSubtitle) {
          ctx.fillStyle = '#f8fafc'
          ctx.font = '40px sans-serif'
          ctx.shadowBlur = 10
          ctx.fillText(safeSubtitle, 80, yPos + 60)
        }

        // Reset shadow for logo background
        ctx.shadowBlur = 15
        ctx.shadowColor = 'rgba(0,0,0,0.3)'
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 10

        // Draw Logo Pill at bottom center
        if (logoToUse) {
           const pillWidth = 480;
           const pillHeight = 120;
           const pillX = canvas.width - pillWidth - 40;
           const pillY = canvas.height - pillHeight - 40;
           
           ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
           ctx.beginPath();
           ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 60);
           ctx.fill();
           
           ctx.shadowBlur = 0; // turn off shadow for image itself
           await drawImage(logoToUse, pillX + 48, pillY + 24, 384, 72);
        }

        // Trigger download
        canvas.toBlob((blob) => {
          if (!blob) return
          const finalUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = finalUrl
          a.download = 'GraphicDesign.png'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(finalUrl)
        }, 'image/png')

      } catch(err: any) {
        console.error('Error drawing canvas', err)
        alert('Error al procesar la descarga de la imagen: ' + (err.message || err))
      }
    }
    
    startDrawing()
  }

  return (
    <div className="mt-4 border border-white/10 bg-white rounded-xl overflow-hidden w-full max-w-sm group relative shadow-2xl">
      {/* Top Image Section */}
      <div 
        className="w-full aspect-square relative flex flex-col justify-between p-6 overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
        }}
      >
        {/* Radial overlay for extra depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0.4)_100%)] mix-blend-overlay pointer-events-none" />

        {/* Background Data Text */}
        {safeBgData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <span className="text-[12rem] font-extrabold text-white/15 leading-none tracking-tighter">
              {safeBgData}
            </span>
          </div>
        )}

        <div className="z-10 relative mt-4">
          <h2 
            className="text-4xl font-extrabold leading-tight text-white font-sans tracking-tight"
            style={{ textShadow: '0 4px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {safeCopyText}
          </h2>
          {safeSubtitle && (
            <p 
              className="text-white/95 text-base mt-3 font-medium font-sans"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
            >
              {safeSubtitle}
            </p>
          )}
        </div>

        {/* The generated transparent person */}
        <div className="absolute inset-0 z-0 flex items-end justify-center pt-20">
          <img 
            src={result.transparentUrl} 
            alt="Generated Graphic Person" 
            className="object-contain w-full h-full object-bottom"
            style={{ 
              filter: 'drop-shadow(3px 0 0 white) drop-shadow(-3px 0 0 white) drop-shadow(0 3px 0 white) drop-shadow(0 -3px 0 white) drop-shadow(0 0 10px rgba(255,255,255,0.6))'
            }}
          />
        </div>

        {/* Logo in bottom-right corner */}
        {logoToUse && (
          <div className="z-10 absolute bottom-4 right-4 flex justify-end">
            <div className="bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-full shadow-sm border border-white/20">
              <img 
                src={logoToUse} 
                alt="Logo" 
                className="h-10 object-contain mix-blend-multiply" 
              />
            </div>
          </div>
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
            className="flex-1 flex items-center justify-center gap-2 bg-[#41e6db] hover:bg-[#34d3c5] text-neutral-900 font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Descargar 8k
          </button>
        </div>
      </div>
    </div>
  )
}
