(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('gardens')) :
  typeof define === 'function' && define.amd ? define(['exports', 'gardens'], factory) :
  (global = global || self, factory(global.tests = {}, global.gardens));
}(this, function (exports, gardens) { 'use strict';

  gardens = gardens && gardens.hasOwnProperty('default') ? gardens['default'] : gardens;

  function waitToEnd( garden, name ) {
    return new Promise( fulfill => setTimeout(() => {
      garden.timeEnd( name );
      fulfill();
    }, 333 ) )
  }

  let obj = {
    a: true,
    b: {
      c: false
    },
    d: 18,
    e: 'hello'
  };

  async function runTest( garden, next ) {
    garden.log( true );
    garden.log( 4 );
    garden.log( obj );
    garden.log( 'Function:', x => 5 );
    garden.log( 'RegExp:', /hello/ig );
    garden.log( 'Object:', obj, 'Boolean:', true );
    garden.success( 'Hello champion!' );
    garden.debug( 'Hello debug sailor?' );
    garden.warning( 'Hello warning!' );
    garden.warn( 'Hello warn!', '\n' );

    garden.count();
    garden.count();
    garden.count( null, 'Should be the same counter as the two above' );

    garden.count( 'count', 'Should start at 1' );
    garden.count( 'count', 'because it uses a string' );

    garden.count( 2 );
    garden.count( 2 );

    let secret = Symbol( 'sailor' );
    garden.count( secret );
    garden.count( secret, '\n' );

    garden.time( '333ms' );
    await waitToEnd( garden, '333ms' );

    garden.time( 3 );
    garden.timeEnd( 3 );

    let immediate = Symbol( 'immediate' );
    garden.time( immediate );
    garden.time( immediate );
    garden.timeEnd( immediate );
    garden.timeEnd( immediate );
    garden.timeEnd( immediate, '\n' ); // Should only throw warning on third time

    garden.trace( 'This should trace, but only when verbose' );

    garden.error( 'This is an error!' );
    garden.typeerror( 'This is a typeerror!' );
    garden.referenceerror( 'This is a referenceerror!' );

    garden.catch( 'This should create an error' );

    garden.assert( true );
    garden.throws( () => garden.assert( false ) );
    garden.assert_eq( 1, 1 );
    garden.throws( () => garden.assert_eq( 1, 2 ) );
    garden.deny( false );
    garden.throws( () => garden.deny( true ) );
    // There's no problem with just returning a boolean so the inner check
    // will throw. Because that throws, the outer check will catch it and continue.
    garden.throws( () => garden.throws( () => true ) );

    next();
  }

  function testGardens( ...list ) {
    if ( gardens.length < 1 ) throw new Error( 'No garden given!' )

    gardens.info( 'Warming up for tests' );

    return new Promise( ( fulfill, reject ) => {
      function iterate( index ) {
        gardens.raw( '\n\n' );
        gardens.log( `Beginning test #${index+1}\n` );

        runTest( list[ index ], () => {
          if ( ++index < list.length ) return iterate( index )

          gardens.raw( '\n\n' );
          gardens.success( 'Done! Tests probably passed!' );
          gardens.info( 'Note that seeing errors above does not indicate a fail' );
          gardens.info( 'Some tests are designed to check error handling behavior' );
          fulfill();
        });
      }

      iterate( 0 );
    })
  }

  function index ( options ) {
    const defaultGarden = gardens.createScope( null, options );

    const customGarden = defaultGarden.createScope( 'customized', {
      displayTime: true,
      displayDate: true,
      scopeStyle: {
        backgroundColor: '#474747',
        borderRadius: '3px',
        color: '#a0bef2',
        fontWeight: 700,
        fontStyle: 'italic',
        padding: '0.15em',
        textDecoration: 'underline'
      }
    });

    const nestedGarden = customGarden.createScope( 'nested', {
      scopeStyle: {
        color: '#393ac1'
      }
    });

    const verboseGarden = defaultGarden.createScope( 'verbose' ).configure({
      verbose: true
    });

    return testGardens( defaultGarden, customGarden, nestedGarden, verboseGarden )
  }

  exports.default = index;
  exports.testGardens = testGardens;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=rollup.js.map
