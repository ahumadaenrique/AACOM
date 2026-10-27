/**
 * Configuración centralizada del sitio aacomsoft.com
 * Todos los datos verificados, teléfonos, correos y opciones de marca se configuran aquí.
 */

export const SITE_CONFIG = {
  brandName: 'AACOMSoft',
  brandMode: (process.env.NEXT_PUBLIC_BRAND_MODE as 'A' | 'B') || 'A', // 'A' = Marca independiente neutral, 'B' = Con respaldo
  
  // Contacto y Teléfono Real
  phone: '+52 (55) 1501 5502',
  phoneRaw: '+525515015502',
  whatsappNumber: '525515015502',
  whatsappMessage: 'Hola, solicito información y agendar una sesión demostrativa de AACOMSoft para promotoría.',
  get whatsappUrl() {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(this.whatsappMessage)}`;
  },
  
  // Correos
  supportEmail: 'soporte@aacomsoft.com',
  leadsEmail: 'enrique.ahumada@aacommx.com',
  
  // Tiempos y Promesas
  responseTime: 'a la brevedad (días hábiles)',
  demoDuration: '20 minutos',
  
  // Metodología de Actividad (REGLA LEGAL: Nombrar siempre "método de actividad por puntos", NUNCA "25 puntos")
  activityMethodLabel: 'método de actividad por puntos',
  
  // Precios
  pricing: {
    agencyPlanMxn: 2499,
    additionalSeatMxn: 299,
    trialMode: process.env.NEXT_PUBLIC_PRICING_TRIAL === 'on', // Apagado por defecto
  },
  
  // Titular Hero (A/B testing)
  // 1: "Una promotoría eficiente con los roles necesarios en una única plataforma."
  // 2: "Dirección, reclutamiento, coaching y fuerza de ventas en una única plataforma."
  // 3: "Menos hojas de cálculo, mayor control de actividad y más pólizas emitidas."
  headlineVariant: (process.env.NEXT_PUBLIC_HERO_HEADLINE as '1' | '2' | '3') || '1',
};
