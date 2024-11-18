import { defineConfig } from 'tsup';

export default defineConfig([
  {
    clean: true,
    dts: true,
    minify: false,
    entry: ['src/index.ts', 'src/register.ts'],
    format: ['cjs', 'esm'],
    target: 'esnext',
    outDir: 'dist',
  },
]);
