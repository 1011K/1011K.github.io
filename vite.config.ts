import { defineConfig } from 'vite';

// Relative base: works at https://1011k.github.io/ and under any sub-path.
export default defineConfig({ base: './', build: { sourcemap: false } });
