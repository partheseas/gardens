import gardens from '..';
import tests from './tests';

tests( gardens );

if ( typeof document !== 'undefined' ) {
  const output = document.getElementById( 'output' );
  const stream = {
    write( string ) {
      output.innerHTML += string;
    }
  };

  tests( gardens, {
    stream,
    outputType: 'html'
  });
}
