import gardens from 'gardens'
import tests from './tests'

tests().then( () => {
  if ( gardens.environment.browser ) {
    const output = document.getElementById( 'output' )
    const stream = {
      write( string ) {
        output.innerHTML += string
      }
    }

    tests({
      stream,
      outputType: 'html'
    })
  }
})
