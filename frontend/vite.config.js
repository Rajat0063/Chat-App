import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';

function caseInsensitiveResolvePlugin() {
  return {
    name: 'case-insensitive-resolve',
    resolveId(source, importer) {
      if (!importer || source.startsWith('\0') || source.includes('node_modules')) return null;
      if (source.startsWith('.')) {
        const dir = path.dirname(importer);
        const resolvedPath = path.resolve(dir, source);
        if (fs.existsSync(resolvedPath)) return null;

        const parentDir = path.dirname(resolvedPath);
        const targetBase = path.basename(resolvedPath).toLowerCase();

        if (fs.existsSync(parentDir)) {
          const files = fs.readdirSync(parentDir);
          const matched = files.find((f) => f.toLowerCase() === targetBase);
          if (matched) {
            return path.join(parentDir, matched);
          }
          const targetBaseNoExt = targetBase.replace(/\.(jsx|js|tsx|ts)$/, '');
          const matchedExt = files.find(
            (f) => f.toLowerCase().replace(/\.(jsx|js|tsx|ts)$/, '') === targetBaseNoExt
          );
          if (matchedExt) {
            return path.join(parentDir, matchedExt);
          }
        }
      }
      return null;
    },
  };
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
