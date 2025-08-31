export type VideoType = 'youtube' | 'vimeo' | 'direct' | 'invalid';

export interface VideoInfo {
  type: VideoType;
  id?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Detects video URL type and extracts relevant information
 */
export function getVideoInfo(url: string): VideoInfo {
  if (!url || typeof url !== 'string') {
    return { type: 'invalid' };
  }

  const trimmedUrl = url.trim();
  
  // YouTube patterns
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = trimmedUrl.match(youtubeRegex);
  
  if (youtubeMatch && youtubeMatch[1]) {
    const videoId = youtubeMatch[1];
    return {
      type: 'youtube',
      id: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
  }

  // Vimeo patterns
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
  const vimeoMatch = trimmedUrl.match(vimeoRegex);
  
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      id: videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`
    };
  }

  // Direct video file patterns
  const directVideoRegex = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i;
  if (directVideoRegex.test(trimmedUrl)) {
    return {
      type: 'direct',
      embedUrl: trimmedUrl
    };
  }

  return { type: 'invalid' };
}

/**
 * Validates if a video URL is supported
 */
export function isValidVideoUrl(url: string): boolean {
  const info = getVideoInfo(url);
  return info.type !== 'invalid';
}

/**
 * Gets embed URL for a video
 */
export function getVideoEmbedUrl(url: string): string | null {
  const info = getVideoInfo(url);
  return info.embedUrl || null;
}

/**
 * Gets thumbnail URL for a video
 */
export function getVideoThumbnail(url: string): string | null {
  const info = getVideoInfo(url);
  return info.thumbnailUrl || null;
}