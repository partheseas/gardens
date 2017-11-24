// MIT License / Copyright Kayla Washburn 2017

"use strict";

let events = require( 'events' )
let fs = require( 'fs' )
let util = require( 'util' )

let chalk = require( 'chalk' )
let supportsColor = require( 'supports-color' )

let configuration = {}

class Timer {
  constructor( garden, name ) {
    this.garden = garden
    this.name = name

    // This is last, for performance
    this.beginning = process.hrtime()
  }

  end() {
    // This is first, for performance
    let [ s, ns ] = process.hrtime( this.beginning )
    this.garden._emit( 'timer', this.name, s, ns )

    // Pad with the appropriate amount of zeros for logging
    ns = '0'.repeat( 9 - ns.toString().length ) + ns

    print( this.garden, `Timer:${this.name.toString()}`, `took ${s}.${ns} seconds` )
  }
}

module.exports = class Garden extends events.EventEmitter {
  constructor( name, verbose ) {
    // Make it an EventEmitter
    super()

    this.name = name
    this.verbose = verbose
    this._times = {}
    this._counts = {}

    this.color = 0
    for ( var i in name ) this.color += name.charCodeAt( i )
    this.color %= 199
    this.color += 25

    console.log( chalk.ansi256( this.color )( this.name, this.color ) )
  }

  static configure( update ) {
    return Object.assign( configuration, update )
  }

  static createGarden( ...conf ) {
    return new Garden( ...conf )
  }

  isVerbose() {
    return this.verbose || configuration.verbose
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
    return this._times[ name ] = new Timer( this, name )
  }

  timeEnd( name ) {
    if ( !this._times[ name ] ) return this.error( `.timeEnd was called with name ${name} before .time!` )
    this._times[ name ].end()
  }

  count( name = 'anonymous' ) {
    if ( !this._counts[ name ] ) this._counts[ name ] = 0
    print( this, `Count:${name.toString()}`, ++this._counts[ name ] )
  }
}

let formats = module.exports.formats = {
  O: O => util.inspect( O ),
  o: o => util.inspect( o ).replace(/\s*\n\s*/g, ' '),
  
}

let pretty = function ( message, format = 'O' ) {
  if ( typeof formats[ format ] !== 'function' ) return console.error( new TypeError( `Invalid format '${format}'!` ) )
  return typeof message === 'string' ? message : formats[ format ]( message, { colors: true } )
}

let print = function ( garden, type, message, extra ) {
  if ( typeof message === 'string' ) message = message.replace( /%([A-Za-z%])?/g, ( _, format ) => {
    if ( extra.length ) return format === '%' ? '%' : pretty( extra.shift(), format )
    return _
  } )

  process.stdout.write( `${chalk.ansi256( garden.color )( `[${garden.name}][${type}]` )}  ${pretty( message ) }` )
  extra.forEach( each => process.stdout.write( ' ' + pretty( each ) ) )

  if ( configuration.outputPath ) fs.appendFile(
    configuration.outputPath,
    `[${new Date().toLocaleString()}][${name}][${type}]  ${pretty( message )}\n`,
    'utf-8',
    error => { if ( error ) console.error( error ) }
  )

  process.stdout.write( '\n' )
}
