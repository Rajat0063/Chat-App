import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';

function caseInsensitiveResolvePlugin() {
  /** @type {import('vite').Plugin} */
  const plugin = {
    name: 'case-insensitive-resolve',
    enforce: 'pre' as any,
    resolveId(source, importer) {
      if (!importer || source.startsWith('\0') || source.includes('node_modules')) return null;
      if (!source.startsWith('.') && !source.startsWith('@')) return null;

      let resolvedPath = '';
      if (source.startsWith('.')) {
        resolvedPath = path.resolve(path.dirname(importer), source);
      } else if (source.startsWith('@/')) {
        resolvedPath = path.resolve(__dirname, './src', source.slice(2));
      } else if (source.startsWith('@src/')) {
        resolvedPath = path.resolve(__dirname, './src', source.slice(5));
      } else {
        return null;
      }

      if (!resolvedPath.includes(path.resolve(__dirname, 'src'))) return null;

      const parentDir = path.dirname(resolvedPath);
      const targetBase = path.basename(resolvedPath).toLowerCase();
      const targetBaseNoExt = targetBase.replace(/\.(jsx|js|tsx|ts)$/, '');

      if (fs.existsSync(parentDir)) {
        const files = fs.readdirSync(parentDir);
        const matched = files.find((f) => f.toLowerCase() === targetBase) ||
                        files.find((f) => f.toLowerCase().replace(/\.(jsx|js|tsx|ts)$/, '') === targetBaseNoExt);
        if (matched) {
          return path.join(parentDir, matched);
        }
      }
      return null;
    },
  };
  return plugin;
}

export default defineConfig({
  plugins: [caseInsensitiveResolvePlugin(), react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@src', replacement: path.resolve(__dirname, './src') },
      { find: '@/src', replacement: path.resolve(__dirname, './src') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
