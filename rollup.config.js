export default [{
  input: 'lib/gardens.js',
  external: [ 'chalk', 'perf_hooks', 'supports-color', 'util' ],
  output: {
    format: 'umd',
    file: 'dist/gardens.js',
    name: 'gardens',
    sourcemap: true
  }
}, {
  input: 'tests/index.js',
  external: [ 'gardens' ],
  output: {
    format: 'umd',
    file: 'tests/index.bundle.js',
    name: 'tests',
    sourcemap: true,
    globals: {
      'gardens': 'gardens'
    },
    exports: 'named'
  }
}]
