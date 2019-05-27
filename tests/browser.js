tests.default().then( () => {
  const output = document.getElementById( 'output' )
  const stream = {
    write( string ) {
      output.innerHTML += string
    }
  }

  tests.default({
    stream,
    outputType: 'html'
  })
})
