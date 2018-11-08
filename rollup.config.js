export default [{
  input: 'src/gardens.js',
  output: {
    format: 'umd',
    file: 'dist/gardens.js',
    name: 'gardens',
    sourcemap: true
  }
}, {
  input: 'tests/index.js',
  output: {
    format: 'umd',
    file: 'tests/rollup.js',
    name: 'tests',
    sourcemap: true,
    globals: {
      'gardens': 'gardens'
    }
  }
}]
