// MIT License / Copyright Kayla Washburn 2017

"use strict";

let events = require( 'events' )
let fs = require( 'fs' )
let util = require( 'util' )

let chalk = require( 'chalk' )

let configuration = {}
let formats = {
  O: O => util.inspect( O ),
  o: o => util.inspect( o ).replace( /\s*\n\s*/g, ' ' )
}

module.exports = class Garden extends events.EventEmitter {
  constructor( name, conf ) {
    // Make it an EventEmitter
    super()

    Object.assign( this, conf )
    this.name = name
    this._times = {}
    this._counts = {}

    this.color = 0
    for ( var i in name ) this.color += name.charCodeAt( i )
    this.color %= 199
    this.color += 25
  }

  static createGarden( ...conf ) {
    return new Garden( ...conf )
  }

  static configure( update ) {
    return Object.assign( configuration, update )
  }

  static get configuration() {
    return configuration
  }

  static get formats() {
    return formats
  }

  configure( update ) {
    return Object.assign( this, update )
  }

  isVerbose() {
    return this.verbose || configuration.verbose
  }

  isTimed() {
    return this.timed || configuration.timed
  }

  _emit( event, ...said ) {
    this.emit( event, ...said )
    this.emit( 'print', ...said )
  }

  debug( message, ...extra ) {
    this._emit( 'debug', message, ...extra )
    if ( this.isVerbose() ) {
      print( this, 'Debug', message, extra )
      return true
    }
    return false
  }

  trace( message, ...extra ) {
    let error = new Error( message )
    this._emit( 'trace', error, ...extra )
    if ( this.isVerbose() ) {
      print( this, 'Trace', message, extra )
      console.log( error.stack )
      return true
    }
    return false
  }

  log( message, ...extra ) {
    this._emit( 'log', message, ...extra )
    print( this, 'Log', message, extra )
  }

  info( ...details ) {
    this.log( ...details )
  }

  warning( message, ...extra ) {
    this._emit( 'warning', message, ...extra )
    print( this, 'Warning', chalk.yellow( message ), extra )
  }

  warn( ...details ) {
    this.warning( ...details )
  }

  error( message, ...extra ) {
    let error = new Error( message )
    this._emit( 'error', error, ...extra )
    print( this, 'Error', chalk.red( message ), extra )
    console.log( error.stack )
    return error
  }

  typeerror( message, ...extra ) {
    let error = new TypeError( message )
    this._emit( 'typeerror', error, ...extra )
    print( this, 'TypeError', chalk.red( message ), extra )
    console.log( error.stack )
    return error
  }

  referenceerror( message, ...extra ) {
    let error = new ReferenceError( message )
    this._emit( 'referenceerror', error, ...extra )
    print( this, 'ReferenceError', chalk.red( message ), extra )
    console.log( error.stack )
    return error
  }

  catch( error, ...extra ) {
    if ( !error.stack ) error = new Error( error )
    this._emit( 'catch', error, ...extra )
    print( this, 'Caught Error', `${chalk.red( error.name )}: ${error.message}`, extra )
    console.log( error.stack )
    return error
  }

  time( name = 'anonymous' ) {
    this._times[ name ] = process.hrtime()
  }

  timeEnd( name = 'anonymous', ...extra ) {
    if ( !this._times[ name ] ) return this.error( `.timeEnd was called with name ${name} before .time!` )

    let [ s, ns ] = process.hrtime( this._times[ name ] )
    this._times[ name ] = null
    this._emit( 'timer', name, s, ns )

    // Pad with the appropriate amount of zeros for logging
    ns = '0'.repeat( 9 - ns.toString().length ) + ns

    print( this, `time:${name.toString()}`, `took ${s}.${ns} seconds`, extra )
  }

  count( name = 'anonymous', ...extra ) {
    if ( !this._counts[ name ] ) this._counts[ name ] = 0
    print( this, `count:${name.toString()}`, ++this._counts[ name ], extra )
  }
}

function format( message, format = 'O', color ) {
  if ( typeof formats[ format ] !== 'function' ) return console.error( new TypeError( `Invalid format '${format}'!` ) )
  return typeof message === 'string' ? message : formats[ format ]( message, { colors: true } )
}

function diffString( garden ) {
  let diff = garden._lastCall ? process.hrtime( garden._lastCall ) : [ 0, 0 ]
  garden._lastCall = process.hrtime()

  console.log( diff )

  if ( diff[ 0 ] > 0 ) return `[+${diff[0]}s]`
  if ( diff[ 1 ] > 1e6 ) return `[+${Math.floor(diff[1]/1e6)}ms]`
  else return `[+${diff[1]}ns]`
}

function print( garden, type, message, extra ) {
  if ( typeof message === 'string' ) {
    message = message.replace( /%([A-Za-z%])?/g, ( original, type ) => {
      if ( !extra.length ) return original
      return format === '%' ? '%' : format( extra.shift(), type )
    })
  }

  let diff = diffString( garden )

  let packet = `${
    chalk.ansi256( garden.color )( `[${garden.name}][${type}]${
      garden.isTimed() ? diffString( garden ) : ''
    }` )
  }  ${format( message )}`

  if ( Array.isArray( extra ) ) extra.forEach( each => packet += ' ' + format( each ) )
  process.stdout.write( packet + '\n' )

  void [ configuration.outputPath, garden.outputPath ].forEach( output => {
    if ( typeof output === 'string' ) {
      fs.appendFile(
        output,
        `[${new Date().toLocaleString()}][${garden.name}][${type}]  ${pretty( message )}\n`,
        'utf-8',
        error => { if ( error ) console.error( error ) }
      )
    }
  })
}
