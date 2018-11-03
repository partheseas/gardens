const defaultGarden = require( 'gardens' )
// const defaultGarden = gardens

const customGarden = defaultGarden.createScope( 'customized', {
  displayTime: true,
  displayDate: true,
  scopeStyle: {
    color: '#2d65c4'
  }
})

const nestedGarden = customGarden.createScope( 'nested', {
  scopeStyle: {
    color: '#393ac1'
  }
})

const verboseGarden = defaultGarden.createScope( 'verbose' ).configure({
  verbose: true
})

let list = [ defaultGarden, customGarden, nestedGarden, verboseGarden ]

function waitToEnd( garden, name ) {
  return new Promise( fulfill => setTimeout(() => {
    garden.timeEnd( name )
    fulfill()
  }, 333 ) )
}

let obj = {
  a: true,
  b: {
    c: false
  },
  d: 18,
  e: 'hello'
}

function testGardens( index = 0 ) {
  if ( index >= list.length ) {
    defaultGarden.log( 'Done! Tests probably passed!' )
    defaultGarden.info( 'Note that seeing errors above does not indicate a fail.' )
    defaultGarden.info( 'Some tests are designed to check error handling behavior.' )
    return
  }

  let garden = list[ index ]

  let test = new Promise( async next => {
    garden.raw( '\n\n\n' )

    garden.info( `Beginning test #${index+1}.` )
    garden.log( 'Object ->', obj, '<- there' )
    garden.debug( 'Hello debug sailor?' )
    garden.warning( 'Hello warning!' )
    garden.warn( 'Hello warn!', '\n' )

    garden.count()
    garden.count()
    garden.count()

    garden.raw( '\n' )

    garden.count( 'sailors' )
    garden.count( 'sailors' )
    garden.count( 'sailors' )

    garden.raw( '\n' )

    let secret = Symbol( 'sailors' )
    garden.count( secret )
    garden.count( secret )
    garden.count( secret )

    garden.raw( '\n' )

    garden.time( '333ms' )
    await waitToEnd( garden, '333ms' )

    let immediate = Symbol( 'immediate' )
    garden.time( immediate )
    garden.time( immediate )
    garden.timeEnd( immediate )
    garden.timeEnd( immediate )
    garden.timeEnd( immediate ) // Should only throw warning on third time

    garden.raw( '\n' )

    garden.trace( 'This should trace, but only when verbose' )

    garden.error( 'This is an error!' )
    garden.typeerror( 'This is a typeerror!' )
    garden.referenceerror( 'This is a referenceerror!' )

    garden.catch( 'This should create an error' )

    garden.assert( true )
    garden.assert_eq( 1, 1 )

    try {
      garden.assert( false )
    } catch ( err ) {
      garden.catch( err )
    }

    try {
      garden.assert_eq( 1, 2 )
    } catch ( err ) {
      garden.catch( err )
    }

    next()
  })

  test.then(() => testGardens( ++index ) )
}

defaultGarden.info( 'Warming up for tests' )
testGardens()
