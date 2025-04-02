import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/extension.ts'],
  format: ['cjs'],
  target: 'node16',
  external: ['vscode'],
  noExternal: ['@kaynooo/utils'],
  minify: true,
  sourcemap: false,
  bundle: true,
  splitting: false,
  clean: true,
  dts: false,
  outDir: 'out',
})
