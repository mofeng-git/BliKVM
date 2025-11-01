// Plugins
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import * as sass from 'sass-embedded';
// TODO I want to remove unplugin-fonts/vitenod
import Fonts from 'unplugin-fonts/vite';
// TODO I want to remove vite-plugin-vue-layouts
import Layouts from 'vite-plugin-vue-layouts';
import Vue from '@vitejs/plugin-vue';
import VueRouter from 'unplugin-vue-router/vite';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

// Utilities
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import path from 'path'; // Import the path module
import fs from 'fs';
import { execSync } from 'child_process';

// Get build information
const getGitCommit = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    return 'unknown';
  }
};

const getBuildTime = () => {
  return new Date().toISOString().replace(/T/, '.').replace(/\..+/, '').replace(/:/g, '');
};

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        implementation: sass,
        api: 'modern-compiler', // Use the modern Sass API
      },
      sass: {
        implementation: sass,
        api: 'modern-compiler', // Use the modern Sass API
      },
    },
  },
  base: './',
  plugins: [
    VueRouter(),
    Layouts(),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Components(),
    Fonts({
      google: {
        families: [
          {
            name: 'Roboto',
            styles: 'wght@100;300;400;500;700;900',
          },
        ],
      },
    }),
    AutoImport({
      imports: ['vue', 'vue-router'],
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
  ],
  define: {
    'process.env': {},
    __GIT_COMMIT__: JSON.stringify(getGitCommit()),
    __BUILD_TIME__: JSON.stringify(getBuildTime()),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      package: path.resolve(__dirname, 'package.json'), // Uses path module
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  // vite.config.mjs
  server: {
    host: '0.0.0.0',
    port: 10005,
    https: {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem'),
    },
    proxy: {
      '/tus': {
        target: 'http://192.168.1.217:10002/tus/',
        changeOrigin: true,
        secure: false, // Important for local development
        // Remove the /tus prefix when forwarding to the TUS server
        rewrite: (path) => path.replace(/^\/tus/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying TUS request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('TUS response status:', proxyRes.statusCode);
          });
        },
      },
    },
  },
});
