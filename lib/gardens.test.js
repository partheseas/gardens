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

test( 'Custom streams work, output correctly, and default to plain text', t => {
  const garden = gardens.createScope();

  matchOutput( t, garden, '[log] Hello!' );
  garden.log( 'Hello!' );
});

test( 'Setting an invalid stream should warn and ignore', t => {
  const garden = gardens.createScope();

  testOutput( t, garden, output => output.startsWith( '[warning]' ) );
  garden.configure({
    stream: true
  });

  matchOutput( t, garden, '[info] Logging still works' );
  garden.info( 'Logging still works' );
});

test( 'Scope names work properly', t => {
  const garden = gardens.createScope( 'test' );

  matchOutput( t, garden, '[test][log] Hello!' );
  garden.log( 'Hello!' );
});

test( 'Bound garden methods work correctly', t => {
  const garden = gardens.createScope( 'bound' );
  const { log, count } = garden.bound();

  matchOutput( t, garden, '[bound][log] Hello!' );
  log( 'Hello!' );
  matchOutput( t, garden, '[bound][count] 1 time' );
  count();
});

test( 'Count method increments by 1 and pluralized correctly', t => {
  const garden = gardens.createScope();

  matchOutput( t, garden, '[count] 1 time' );
  garden.count();
  matchOutput( t, garden, '[count] 2 times' );
  garden.count();
  matchOutput( t, garden, '[count] 3 times' );
  garden.count();
});

test( 'Counting using a Symbol works correctly', t => {
  const garden = gardens.createScope();
  const symbol = Symbol( 'count' );

  matchOutput( t, garden, '[Symbol(count)] 1 time' );
  garden.count( symbol );
  matchOutput( t, garden, '[Symbol(count)] 2 times' );
  garden.count( symbol );
  matchOutput( t, garden, '[Symbol(count)] 3 times' );
  garden.count( symbol );
});

test( 'Count can be reset', t => {
  const garden = gardens.createScope();

  matchOutput( t, garden, '[count] 1 time' );
  garden.count();
  matchOutput( t, garden, '[count] 2 times' );
  garden.count();

  garden.countReset();

  matchOutput( t, garden, '[count] 1 time' );
  garden.count();
});

