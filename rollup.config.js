import typescript from 'rollup-plugin-typescript2';
import minify from 'rollup-plugin-babel-minify';

export default [{
  input: 'lib/umd.ts',
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
    file: 'dist/gardens.js',
    name: 'gardens',
    sourcemap: true
  }
}, {
  input: 'lib/reactnative.ts',
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
    file: 'dist/reactnative.js',
    name: 'gardens',
    sourcemap: true
  }
}, {
  input: 'bad_tests/umd.ts',
  external: [ 'gardens' ],
  plugins: [
    typescript({
      abortOnError: false,
      lib: [ 'dom' ],
      tsconfigOverride: {
        declaration: false,
        lib: [ 'dom' ]
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
