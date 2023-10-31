export default defineNuxtConfig({
  devtools: { enabled: true },
  alias: {
    './runtimeConfig': './runtimeConfig.browser',
  },
  vite: {
    define: {
      'window.global': {},
    },
  },
});
