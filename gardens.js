// MIT License / Copyright Kayla Washburn 2017

"use strict";

const fs = require( 'fs' )
const path = require( 'path' )
const util = require( 'util' )
const chalk = require( 'chalk' )

let scopeColor = 0

class Garden {
  constructor( scope, options ) {
    if ( typeof scope !== 'string' && scope != null )
      throw "new Garden( scope, options ): scope must be a string or undefined"

    this.options = {
      stream: process.stdout, scope,
      scopeStyle: chalk.ansi256( scopeColor++ % 199 + 25 ),
      verbose: false,
      displayTime: false,
      displayDate: false
    }

    options && this._checkOptions( options )

    this._times = {}
    this._counts = {}
  }

  configure( update ) {
    return Object.assign( this.options, this._checkOptions( update ) )
  }

  _checkOptions( update ) {
    if ( update.stream && update.stream.write ) {
      this.options.stream = update.stream
      this.colorized = supportsColor( stream ).level
    }

    if ( update.scopeStyle && typeof update.scopeStyle === 'function' ) this.options.scopeStyle = update.scopeStyle

    if ( update.verbose )     this.options.verbose = true
    if ( update.displayDate ) this.options.displayDate = true
    if ( update.displayTime ) this.options.displayTime = true
  }

  debug( message, ...extra ) {
    if ( this.options.verbose ) {
      this._print( 'debug', message, extra )
      return true
    }
    return false
  }

  trace( message, ...extra ) {
    let error = new Error( message )
    if ( this.options.verbose ) {
      this._print( 'trace', message, extra )
      return true
    }
    return false
  }

  log( message, ...extra ) {
    this._print( 'log', message, ...extra )
  }

  info( ...details ) {
    this.log( ...details )
  }

  warning( message, ...extra ) {
    this._print( 'warning', `${chalk.yellow(message)}`, ...extra )
  }

  warn( ...details ) {
    this.warning( ...details )
  }

  error( message, ...extra ) {
    let error = new Error( message )
    this._print( 'error', `${message}\n${error.stack}\n`, ...extra )
    return error
  }

  typeerror( message, ...extra ) {
    let error = new TypeError( message )
    this._print( 'typeerror', `${message}\n${error.stack}\n`, ...extra )
    return error
  }

  referenceerror( message, ...extra ) {
    let error = new ReferenceError( message )
    this._print( 'referenceerror', `${message}\n${error.stack}\n`, ...extra )
    return error
  }

  catch( error, ...extra ) {
    if ( !error.stack ) error = new Error( error )
    this._print( 'caught error', `${chalk.red(error.name)}: ${error.message}\n${error.stack}\n`, ...extra )
    return error
  }

  time( name = 'secret' ) {
    if ( !this._times[ name ] ) this._times[ name ] = [ process.hrtime() ]
    else this._times[ name ].push( process.hrtime() )
  }

  timeEnd( name = 'secret', ...extra ) {
    if ( !this._times[ name ] || !this._times[ name ].length ) return this.error( `.timeEnd was called with name ${name} before .time!` )

    let [ s, ns ] = process.hrtime( this._times[ name ] ).pop()
    ns = '0'.repeat( 9 - ns.toString().length ) + ns // Pad with the appropriate amount of zeros
    print( this, `time:${name.toString()}`, `took ${s}.${ns} seconds`, ...extra )
  }

  count( name = 'secret', ...extra ) {
    if ( !this._counts[ name ] ) this._counts[ name ] = 0
    this._print( `count:${name.toString()}`, ++this._counts[ name ], ...extra )
  }

  _print( type, ...messages ) {
    if ( this.options.scope )
      this.options.stream.write( this.options.scopeStyle( `[${this.options.scope}]` ) )

    this.options.stream.write( this.options.scopeStyle( `[${type}]` ) )

    if ( this.options.displayDate )
      this.options.stream.write( chalk.gray( `[${new Date().toLocaleDateString()}]` ) )
    if ( this.options.displayTime )
      this.options.stream.write( chalk.gray( `[${new Date().toLocaleTimeString()}]` ) )

    messages.forEach( each => {
      this.options.stream.write( ` ${ typeof each === 'string' ? each : util.inspect( each, { colors: supportsColor } )}` )
    })

    this.options.stream.write( '\n' )
  }
}



module.exports = new Garden()
module.exports.default = module.exports
