// MIT License / Copyright Kayla Washburn 2017

"use strict";

const ow = require( 'ow' )
const chalk = require( 'chalk' )
const { supportsColor } = require( 'supports-color' )
const { EventEmitter } = require( 'events' )
const util = require( 'util' )

let position = 0
function hashyColor() {
  return position++ % 199 + 25
}

class Garden extends EventEmitter {
  constructor( scope, options ) {
    // Construct EventEmitter
    super()

    if ( ow.isValid( scope, ow.string.not.empty ) ) scope = [ scope ]
    else ow( scope, ow.any( ow.array.ofType( ow.string ), ow.nullOrUndefined ) )

    this.options = this._checkOptions( options )
    this.stream = this.options.stream
    this.options.scope = scope

    this.chalk = chalk.constructor( supportsColor( stream ) )
    this.secret = Symbol( 'secret' )
    this._timers = {}
    this._counters = {}

    splatter( this, details => {
      return function ( ...output ) {
        if ( details.quiet && !this.options.verbose ) return;
        if ( this.options.displayDate )
          this.stream.write( this.chalk.gray( `[${new Date().toLocaleDateString()}] ` ) )
        if ( this.options.displayTime )
          this.stream.write( this.chalk.gray( `[${new Date().toLocaleTimeString()}] ` ) )

        if ( this.options.scope ) {
          this.options.scope.forEach( scope => {
            this.stream.write( this.options.scopeStyle( `[${scope}] ` ) )
          })
        }

        this.stream.write( `${details.icon}  ${details.style( details.label )}` )

        this._genericf( ...output )
      }
    })
  }

  _checkOptions( options ) {
    let checked = {
      stream: process.stdout,
      scopeStyle: chalk.ansi256( hashyColor() ),
      verbose: false,
      displayTime: false,
      displayDate: false
    }

    if ( ow.isValid( options, ow.nullOrUndefined ) ) return checked

    ow( options, ow.object )

    if ( options.stream && options.stream.write ) checked.stream = options.stream

    if ( options.scopeStyle ) {
      ow( options.scopeStyle, ow.function.label( 'colorizer' ) )
      checked.scopeStyle = options.scopeStyle
    }

    if ( options.verbose )          checked.verbose = true
    if ( options.displayDate )      checked.displayDate = true
    if ( options.displayTime ) checked.displayTime = true

    return checked
  }

  scope( name, options ) {
    ow( name, ow.string )
    let newScope = Array.from( this.options.scope || [] )
    newScope.push( name )

    return new Garden( newScope, options )
  }

  time( name, ...more ) {
    ow( name, ow.any( ow.string, ow.symbol, ow.undefined ) )
    if ( !name ) name = this.secret
    if ( !this._timers[ name ] ) this._timers[ name ] = []
    this._timers[ name ].push( process.hrtime() )

    if ( more.length > 0 ) this._genericf( more )
  }

  timeEnd( name, ...more ) {
    ow( name, ow.any( ow.string, ow.symbol, ow.undefined ) )
    if ( !name ) name = this.secret
    if ( !this._timers[ name ] ) this._timers[ name ] = []

    this._timeEnd( this._timers[ name ].pop() )
  }

  count( name, ...more ) {
    ow( name, ow.any( ow.string, ow.symbol, ow.undefined ) )
    if ( !name ) name = this.secret
    if ( !this._counters[ name ] ) this._counters[ name ] = 1
    this._count( this._counters[ name ]++ )
  }

  _genericf( ...items ) {
    items.forEach( item => {
      this.stream.write( ` ${ow.isValid( item, ow.string ) ? item : util.inspect( item, { colors: this.chalk.enabled } )} ` )
    })

    this.stream.write( '\n' )
  }
}

function splatter( garden, sprinkler ) {
  let chalk = garden.chalk

  let splats = {
    'catch': {
      style: chalk.red.underline,
      thrower: error => error != null && error.stack ? error : new Error( error ),

      icon: '🕸', label: 'caught' },

    'complete': {
      style: chalk.green,

      icon: '✔', label: 'complete' },

    'debug': {
      quiet: true,
      style: chalk.keyword('orange').underline,

      icon: '☢', label: 'debug' },

    'error': {
      style: chalk.red.underline,
      thrower: Error,

      icon: '❌', label: 'error' },

    'log': {
      alias: 'info',
      style: chalk.underline,

      icon: '📃', label: '' },

    'referenceerror': {
      style: chalk.red.underline,
      thrower: ReferenceError,

      icon: '⁉', label: 'reference error' },

    '_timeEnd': {
      style: chalk.blue,

      icon: '🕓', label: 'timed' },

    '_count': {
      style: chalk.blue,

      icon: '💯', label: 'count' },

    'trace': {
      quiet: true,
      style: chalk.red.underline,
      thrower: Error,

      icon: '🎯', label: 'trace' },

    'typeerror': {
      style: chalk.red.underline,
      thrower: TypeError,

      icon: '🦈', label: 'type error' },

    'warn': {
      alias: 'warning',
      style: chalk.yellow.underline,

      icon: '⚠', label: 'warning' }
  }

  Object.keys( splats ).forEach( splatName => {
    let splat = splats[ splatName ]
    garden[ splatName ] = sprinkler( splat )
    if ( splat.alias ) garden[ splat.alias ] = garden[ splatName ]
  })
}

module.exports = new Garden()
module.exports.default = module.exports
