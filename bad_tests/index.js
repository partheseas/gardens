import gardens from '..';
import tests from './tests.js';

tests();

if ( gardens.environment.browser ) {
  const output = document.getElementById( 'output' );
  const stream = {
    write( string ) {
      output.innerHTML += string;
    }
  };

  tests({
    stream,
    outputType: 'html'
  });
}
