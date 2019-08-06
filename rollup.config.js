import typescript from 'rollup-plugin-typescript2';
import minify from 'rollup-plugin-babel-minify';

export default [{
  // UMD: Browsers and Node.js
  // =========================
  input: 'platform/umd.ts',
  external: [
    'chalk',
    'perf_hooks',
    'readline',
    'supports-color',
    'util'
  ],
  plugins: [
    typescript({
      abortOnError: false,
      useTsconfigDeclarationDir: true
    }),
    minify({
      comments: false
    })
  ],
  output: {
    format: 'umd',
    file: 'dist/gardens.umd.js',
    name: 'gardens',
    sourcemap: true
  }
}, {
  // CJS: React Native (barebones)
  // =============================
  input: 'platform/reactnative.ts',
  plugins: [
    typescript({
      abortOnError: false,
      useTsconfigDeclarationDir: true
    }),
    minify({
      comments: false
    })
  ],
  output: {
    format: 'cjs',
    file: 'dist/gardens.rn.js',
    name: 'gardens',
    sourcemap: true
  }
}, {
  // Integration Tests
  // =================
  input: 'bad_tests/umd.ts',
  external: [ 'gardens' ],
  plugins: [
    typescript({
      abortOnError: false,
      // Even though we don't output declarations for tests, our override won't
      // even be checked if we don't set this to true.
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        declaration: false,
      }
    }),
    minify({
      comments: false
    })
  ],
  output: {
    format: 'umd',
    file: 'bad_tests/index.js',
    name: 'tests',
    sourcemap: true,
    globals: {
      '..': 'gardens'
    },
    exports: 'named'
  }
}];
