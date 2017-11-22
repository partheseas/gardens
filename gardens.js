// MIT License / Copyright Kayla Washburn 2017

"use strict";

let events = require( 'events' )
let fs = require( 'fs' )
let util = require( 'util' )

let configuration = {}
let outputStream

class Timer {
  constructor( garden, name = 'anonymous' ) {
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

    print( this.garden.name, `Timer:${this.name.toString()}`, `took ${s}.${ns} seconds` )
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
      print( this.name, 'Debug', format( message ), extra )
      return true
    }
    return false
  }

  trace( message, ...extra ) {
    let error = new Error( message )
    this._emit( 'trace', error, ...extra )
    if ( this.isVerbose() ) {
      print( this.name, 'Trace', format( message ), extra )
      console.log( error.stack )
      return true
    }
    return false
  }

  log( message, ...extra ) {
    this._emit( 'log', message, ...extra )
    print( this.name, 'Log', format( message ), extra )
  }

  info( ...details ) {
    this.log( ...details )
  }

  warning( message, ...extra ) {
    this._emit( 'warning', message, ...extra )
    print( this.name, 'Warning', `\u001b[33m${format( message )}\u001b[39m`, extra )
  }

  warn( ...details ) {
    this.warning( ...details )
  }

  error( message, ...extra ) {
    let error = new Error( message )
    this._emit( 'error', error, ...extra )
    print( this.name, 'Error', `\u001b[31m${format( message )}\u001b[39m`, extra )
    console.log( error.stack )
    return error
  }

  typeerror( message, ...extra ) {
    let error = new TypeError( message )
    this._emit( 'typeerror', error, ...extra )
    print( this.name, 'TypeError', `\u001b[31m${format( message )}\u001b[39m`, extra )
    console.log( error.stack )
    return error
  }

  referenceerror( message, ...extra ) {
    let error = new ReferenceError( message )
    this._emit( 'referenceerror', error, ...extra )
    print( this.name, 'ReferenceError', `\u001b[31m${format( message )}\u001b[39m`, extra )
    console.log( error.stack )
    return error
  }

  catch( error, ...extra ) {
    if ( !error.stack ) error = new Error( error )
    this._emit( 'catch', error, ...extra )
    print( this.name, 'Caught Error', `\u001b[31m${error.name}: ${error.message}\u001b[39m`, extra )
    console.log( error.stack )
    return error
  }

  time( name ) {
    return this._times[ name ] = new Timer( this, name )
  }

  timeEnd( name ) {
    if ( !this._times[ name ] ) return this.error( `.timeEnd was called with name ${name} before .time!` )
    this._times[ name ].end()
  }

  count( name = 'anonymous' ) {
    if ( !this._counts[ name ] ) this._counts[ name ] = 0
    print( this.name, `Count:${name.toString()}`, ++this._counts[ name ] )
  }
}

let format = function ( message ) {
  return typeof message === 'string' ? message : util.inspect( message )
}

let print = function ( name, type, message, extra ) {
  process.stdout.write( `[${name}] \u001b[36m[${type}]\u001b[39m  ${message} ` )

  if ( configuration.outputPath ) {
    if ( !outputStream ) outputStream = fs.createWriteStream( configuration.outputPath, { 'flags': 'a' })
    outputStream.write( `[${new Date().toLocaleString()}]  [${name}] [${type}]  ${message}\n` )
  }

  extra && extra.length ? console.log( ...extra ) : process.stdout.write( '\n' )
}
