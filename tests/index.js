let testGardens = require( './wrapped' )

const defaultGarden = require( 'gardens' )

const customGarden = defaultGarden.createScope( 'customized', {
  displayTime: true,
  displayDate: true,
  scopeStyle: {
    color: '#2d65c4',
    fontWeight: 700
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

testGardens( defaultGarden, customGarden, nestedGarden, verboseGarden )
