import minify from 'rollup-plugin-babel-minify'

export default [{
  input: 'lib/gardens.js',
  external: [ 'chalk', 'perf_hooks', 'supports-color', 'util' ],
  plugins: [ minify({ comments: false }) ],
  output: {
    format: 'umd',
    file: 'dist/gardens.js',
    name: 'gardens',
    sourcemap: true
  }
}, {
  input: 'tests/index.js',
  external: [ 'gardens' ],
  plugins: [ minify({ comments: false }) ],
  output: {
    format: 'umd',
    file: 'tests/index.bundle.js',
    name: 'tests',
    sourcemap: true,
    globals: {
      '..': 'gardens'
    },
    exports: 'named'
  }
}]
