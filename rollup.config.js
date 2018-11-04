export default [{
  input: 'src/gardens.js',
  output: {
    format: 'umd',
    file: 'dist/gardens.js',
    name: 'gardens',
    sourcemap: true
  }
}, {
  input: 'tests/main.js',
  output: {
    format: 'umd',
    file: 'tests/wrapped.js',
    name: 'testGardens',
    sourcemap: true,
    globals: {
      'gardens': 'gardens'
    }
  }
}]
