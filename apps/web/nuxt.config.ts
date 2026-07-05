import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineNuxtConfig({
  ssr: false,
  css: ['~/assets/styles/reset.css'],
  nitro: {
    compatibilityDate: '2026-07-05'
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8787'
    }
  },
  vite: {
    plugins: [vanillaExtractPlugin()]
  }
});
