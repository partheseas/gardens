import test from 'ava';
import gardens from '..';

function matchOutput( t, garden, expected ) {
  return garden.configure({
    stream: {
      write: output => t.is( output, `${ expected }\n` )
    }
  });
}

function testOutput( t, garden, test ) {
  return garden.configure({
    stream: {
      write: output => t.true( test( output ) )
    }
  });
}

test( 'Managed gardens are bound by default', t => {
  const manager = gardens.createManager( 'test' );
  const garden = manager.scope();

  testOutput( t, garden, output => output.startsWith( '[test][warning]' ) );
  t.is( garden.bound(), null );
});
