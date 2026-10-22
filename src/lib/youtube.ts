/**
 * Utilidades para la Academia de Videos (Mini YouTube E-Learning)
 * Extrae y valida IDs de YouTube y genera URLs seguras de miniaturas y reproductores.
 */

export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();

  // Coincide con:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v|shorts|live)\/))([\w-]{11})/;
  const match = clean.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  // Si ya es un ID de 11 caracteres alfanuméricos
  if (/^[\w-]{11}$/.test(clean)) {
    return clean;
  }

  return null;
}

export function getYouTubeThumbnail(youtubeId: string, quality: "hq" | "maxres" = "hq"): string {
  if (quality === "maxres") {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
}
