// MIT License / Copyright Kayla Washburn 2017

import util from 'util'
import chalk from 'chalk'
import supportsColor from 'supports-color'
import perf from 'perf_hooks'

let environment = {
  node: typeof process !== 'undefined'
        && typeof util !== 'undefined'
        && typeof chalk !== 'undefined',
  browser: typeof window !== 'undefined'
        && typeof navigator !== 'undefined',
  performance: typeof performance !== 'undefined'
    ? performance
    : perf && perf.performance
}

// If we don't appear to be in Node or a browser, complain
if ( !( environment.node ^ environment.browser ) )
  throw new Error( 'Gardens cannot determine the current environment, or does not support it.' )

// If we are unable to get performance hooks, warn that the feature is broken
if ( !environment.performance )
  console.warn( 'Performance metrics are not available. `time` and `timeEnd` will not function.' )

function colorize( scope ) {
  let r = 75
  let g = 75
  let b = 75

  for ( let char of scope ) {
    b = b * ( scope.charCodeAt( char ) ** 12 ) % 125 + 75;
    [ g, b, r ] = [ r, g, b ]
  }

  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`
}

function toCssString( style ) {
  return style ? `${
  Object.keys( style ).map( prop => `${
    prop.replace(/[A-Z]/g, char => `-${
      char.toLowerCase()
    }`)}: ${
      style[ prop ]
    }`).join('; ')}` : ''
}

class Garden {
  constructor( scope, options ) {
    let fallback = { write: console.log }

    this.options = {
      stream: environment.node
        ? process.stdout
        : fallback,
      scope,
      scopeStyle: {
        color: scope && colorize( scope )
      },
      verbose: false,
      displayTime: false,
      displayDate: false
    }

    options && this._checkOptions( options )

    this._times = {}
    this._counts = {}
  }

  configure( update ) {
    this._checkOptions( update )
    return this
  }

  createScope( scope, options ) {
    if ( typeof scope !== 'string' )
      throw new Error( 'scope must be a string or undefined' )

    // This would be the ideal syntax, but it hasn't landed in Edge yet.
    // Ugh.
    // return new Garden( scope, {
    //   ...options,
    //   _superScope: this
    // })

    return new Garden( scope, Object.assign({ _superScope: this }, options ))
  }

  _checkOptions( update ) {
    if ( update.stream && update.stream.write ) {
      this.options.stream = update.stream
      this.colorized = supportsColor( stream ).level
    }

    if ( update._superScope ) this.options._superScope = update._superScope
    if ( update.scopeStyle ) Object.assign( this.options.scopeStyle, update.scopeStyle )

    if ( update.verbose )     this.options.verbose = true
    if ( update.displayDate ) this.options.displayDate = true
    if ( update.displayTime ) this.options.displayTime = true
  }

  assert( truthy, ...extra ) {
    if ( !truthy ) throw this.assertionerror( `Assert failed! ${truthy} is not truthy!`, ...extra )
  }

  assert_eq( a, b, ...extra ) {
    if ( a !== b ) throw this.assertionerror( `Assert failed! ${a} is not equal to ${b}`, ...extra )
  }

  debug( message, ...extra ) {
    if ( this.options.verbose ) {
      this._print({ type: 'debug' }, message, ...extra )
      return true
    }
    return false
  }

  log( message, ...extra ) {
    this._print({ type: 'log' }, message, ...extra )
  }

  info( ...details ) {
    this.log( ...details )
  }

  warning( message, ...extra ) {
    this._print({ type: 'warning', style: { color: '#ecb448' } }, message, ...extra )
  }

  warn( ...details ) {
    this.warning( ...details )
  }

  trace( message, ...extra ) {
    if ( this.options.verbose ) {
      let error = new Error( message )

      this._print({ type: 'trace', style: { color: '#ff8800' } }, `${message}\n${error.stack}\n`, ...extra )
      return true
    }
    return false
  }

  error( message, ...extra ) {
    let error = new Error( message )
    this._print({ type: 'error', style: { color: '#ff1212' } }, `${message}\n${error.stack}\n`, ...extra )
    return error
  }

  typeerror( message, ...extra ) {
    let error = new TypeError( message )
    this._print({ type: 'type error', style: { color: '#ff1212' } }, `${message}\n${error.stack}\n`, ...extra )
    return error
  }

  referenceerror( message, ...extra ) {
    let error = new ReferenceError( message )
    this._print({ type: 'reference error', style: { color: '#ff1212' } }, `${message}\n${error.stack}\n`, ...extra )
    return error
  }

  assertionerror( message, ...extra ) {
    let error = new Error( message )
    this._print({ type: 'assertion error', style: { color: '#ff1212' } }, `${message}\n${error.stack}\n`, ...extra )
    return error
  }

  catch( error, ...extra ) {
    if ( !error || !error.stack ) error = new Error( error )
    this._print({ type: 'caught error', style: { color: '#ff1212' } }, `${error.name}: ${error.message}\n${error.stack}\n`, ...extra )
    return error
  }

  time( name = 'time' ) {
    if ( arguments.length > 1 ) this.warn( '`.time` should only take one argument. Pass additional arguments to `.timeEnd`.' )
    if ( !environment.performance ) thiw.warn( 'Performance metrics are not available. `time` and `timeEnd` will not function.' )

    if ( !this._times[ name ] ) this._times[ name ] = [ environment.performance.now() ]
    else this._times[ name ].push( environment.performance.now() )
  }

  timeEnd( name = 'time', ...extra ) {
    if ( !this._times[ name ] || !this._times[ name ].length ) {
      this.warn( `.timeEnd was called for ${name.toString()} without a corresponding .time!` )
      return
    }

    // let [ s, ns ] = process.hrtime( this._times[ name ].pop() )
    // ns = '0'.repeat( 9 - ns.toString().length ) + ns // Pad with the appropriate amount of zeros
    // this._print({ type: name.toString() }, `took ${s}.${ns} seconds`, ...extra )

    let ms = environment.performance.now() - this._times[ name ].pop()
    this._print({ type: name.toString() }, `took ${ms} milliseconds`, ...extra)
  }

  count( name = 'count', ...extra ) {
    if ( !this._counts[ name ] ) this._counts[ name ] = 0
    let count = ++this._counts[ name ]
    let pluralOrSingular = count === 1 ? 'time': 'times'

    this._print({ type: name.toString() }, `${count} ${pluralOrSingular}`, ...extra )
  }

  _scopePrefix() {
    // this.options.scopes.forEach( scope => output.push(  ) )
    let prefix = this.options._superScope
      ? this.options._superScope._scopePrefix()
      : []

    if ( this.options.scope ) prefix.push( this._style( `[${this.options.scope}]`, this.options.scopeStyle ) )
    return prefix
  }

  _print({ type, style }, ...messages ) {
    let output = this._scopePrefix()

    output.push( this._style( `[${type}]`, style || { color: '#5b5b5b' } ) )

    if ( this.options.displayDate )
      output.push( this._style( `[${new Date().toLocaleDateString()}]`, { color: '#999999' }) )
    if ( this.options.displayTime )
      output.push( this._style( `[${new Date().toLocaleTimeString()}]`, { color: '#999999' }) )

    messages.forEach( each => {
      typeof each === 'string'
       ? output.push( this._style( ` ${ each }` ) )
       : output.push( this._raw( each ) )
    })

    this.options.stream.write( ...this._transform( output ) )
  }

  _style( text, style ) {
    if ( environment.node ) {
      let wrap = chalk
      if ( style ) {
        if ( style.color ) wrap = wrap.hex( style.color )
        if ( style.fontWeight > 400 ) wrap = wrap.bold
      }
      return {
        text: wrap( text ),
        format: null
      }
    } else if ( environment.browser ) {
      return {
        text,
        format: toCssString( style )
      }
    } else {
      console.error( `Garden doesn't support this environment!` )
    }
  }

  _raw( raw ) {
    return {
      raw
    }
  }

  _transform( output ) {
    let text = ''
    let formats = []
    let raw = []

    // In the browser we preserve raw objects to preserve interactive inspection.
    // (Think of the expand/collapse arrows in pretty much ever browser's DevTools.)
    // After one raw object, we must treat them all as raw, or strings may be
    // printed in the wrong order, which is non-deterministic and bad.
    let allRaw = false

    output.forEach( part => {
      if ( part.raw ) {
        if ( environment.browser ) {
          raw.push( part.raw )
          allRaw = true
        } else if ( environment.node ) {
          text += ` ${util.inspect( part.raw, { colors: chalk.supportsColor.hasBasic } )}`
        }
      } else if ( part.text ) {
        if ( allRaw ) raw.push( part.text )
        else if ( part.format != null ) {
          text += '%c'
          formats.push( part.format )
        }
        text += `${part.text}`
      }
    })

    if ( environment.node ) text += '\n'

    return [ text, ...formats, ...raw ]
  }
}

export default new Garden()
