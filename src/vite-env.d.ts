/// <reference types="vite/client" />

// PWA virtual module typings
declare module 'virtual:pwa-register' {
  export function registerSW(options?: { immediate?: boolean }): () => void
}

