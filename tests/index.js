const defaultGarden = require( 'gardens' )
// const defaultGarden = gardens

const timedGarden = defaultGarden.createScope( 'timed', {
  displayTime: true,
  displayDate: true
})

const coloredGarden = defaultGarden.createScope( 'color', {
  scopeStyle: {
    color: '#2d65c4'
  }
})

const nestedGarden = coloredGarden.createScope( 'nested', {
  scopeStyle: {
    color: '#393ac1'
  }
})

const verboseGarden = defaultGarden.createScope( 'verbose' ).configure({
  verbose: true
})

let list = [ defaultGarden, timedGarden, coloredGarden, nestedGarden, verboseGarden ]

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
  if ( index >= list.length ) return defaultGarden.info( 'Done! Tests probably passed!' )
  let garden = list[ index ]

  let test = new Promise( async next => {
    garden.debug( 'Hello debug sailor?' )
    garden.log( 'Hello sailor.' )
    garden.info( 'Hello', obj, 'there' )
    garden.warning( 'Hello warning!' )
    garden.warn( 'Hello warn!', '\n' )

    garden.count()
    garden.count()
    garden.count()

    garden.count( 'Hello number' )
    garden.count( 'Hello number' )
    garden.count( 'Hello number', '\n' )

    let secret = Symbol( 'count' )
    garden.count( secret )
    garden.count( secret )
    garden.count( secret, '\n' )

    let immediate = Symbol( 'immediate' )
    garden.time( immediate )
    garden.time( immediate )
    garden.timeEnd( immediate )
    garden.timeEnd( immediate )
    garden.timeEnd( immediate ) // Should only throw warning on third time

    garden.time( '1/3 second' )
    await waitToEnd( garden, '1/3 second' )

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
      garden.catch( err, '\n\n\n' )
    }

    next()
  })

  test.then(() => testGardens( ++index ) )
}

testGardens()
