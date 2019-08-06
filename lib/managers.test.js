import test from 'ava';
import gardens from '..';

function matchOutput( t, garden, expected ) {
  garden.configure({
    stream: {
      write: output => t.is( output, `${ expected }\n` )
    }
  });
}

function testOutput( t, garden, test ) {
  garden.configure({
    stream: {
      write: output => t.true( test( output ) )
    }
  });
}

test( 'Streams are properly inherited when using managers', t => {
  const manager = gardens.createManager( 'test' );
  const base = manager.scope();
  matchOutput( t, base, '[test][nested][log] Hello!' );

  const nested = manager.scope( 'nested' );
  nested.log( 'Hello!' );
});

test( 'Managed gardens cannot construct other gardens or be rebound', t => {
  const manager = gardens.createManager( 'test' );
  const garden = manager.scope();

  testOutput( t, garden, output => output.startsWith( '[test][warning]' ) );
  t.is( garden.bound(), null );
  t.is( garden.createScope(), null );
  t.is( garden.createManager(), null );
});
