import minify from 'rollup-plugin-babel-minify';

export default [{
  input: 'lib/umd.js',
  external: [
    'chalk',
    'perf_hooks',
    'supports-color',
    'util'
  ],
  plugins: [
    minify({ comments: false })
  ],
  output: {
    format: 'umd',
    file: 'dist/gardens.js',
    name: 'gardens',
    sourcemap: true
  }
}, {
  input: 'lib/reactnative.js',
  plugins: [
    minify({ comments: false })
  ],
  output: {
    format: 'cjs',
    file: 'dist/reactnative.js',
    name: 'gardens',
    sourcemap: true
  }
}, {
  input: 'bad_tests/umd.js',
  external: [ 'gardens' ],
  plugins: [
    minify({ comments: false })
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
