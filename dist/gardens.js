(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('chalk'), require('supports-color'), require('perf_hooks'), require('util')) :
  typeof define === 'function' && define.amd ? define(['chalk', 'supports-color', 'perf_hooks', 'util'], factory) :
  (global = global || self, global.gardens = factory(global.chalk, global.color, global.perf, global.util));
}(this, function (chalk, color, perf, util) { 'use strict';

  chalk = chalk && chalk.hasOwnProperty('default') ? chalk['default'] : chalk;
  color = color && color.hasOwnProperty('default') ? color['default'] : color;
  perf = perf && perf.hasOwnProperty('default') ? perf['default'] : perf;
  util = util && util.hasOwnProperty('default') ? util['default'] : util;

  class Manager {
    constructor( garden ) {
      this.scopes = {
        default: garden,
        nested: {}
      };
      this.output = this.scopes.default.createScope( `manager` );
    }

    scope( ...details ) {
      let cursor = this.scopes;

      for ( let i = 0; i < details.length; i++ ) {
        if ( typeof details[ i ] !== 'string' ) throw this.output.typeerror( 'Scope names must be all be strings' )
        let name = details[ i ];

        if ( name in cursor.nested ) {
          cursor = cursor.nested[ name ];
        } else {
          cursor = cursor.nested[ name ] = {
            default: cursor.default.createScope( name ),
            nested: {}
          };
        }
      }

      return cursor.default
    }
  }

  let environment = {
    node: typeof process !== 'undefined'
          && typeof util !== 'undefined'
          && typeof chalk !== 'undefined',
    browser: typeof window !== 'undefined'
          && typeof navigator !== 'undefined',
    performance: typeof performance !== 'undefined'
      ? performance
      : perf && perf.performance
  };

  // If we don't appear to be in Node or a browser, complain.
  // If we appear to be in both, that is also bad. That's why we
  // use ^ instead of ||.
  if ( !( environment.node ^ environment.browser ) )
    throw new Error( 'Gardens cannot determine the current environment, or does not support it.' )

  environment.defaultOutputType = environment.node
    ? color.stdout.hasBasic ? 'ansi' : 'text'
    : 'console';

  function colorize( scope ) {
    let r = 50;
    let g = 50;
    let b = 50;

    for ( let char in scope ) {
      r = r * ( scope.charCodeAt( char ) ** 12 ) % 175 + 50;
      [ b, r, g ] = [ r, g, b ];
    }

    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`
  }

  function toString( from, fallback ) {
    return from != null && typeof from.toString === 'function'
      ? from.toString()
      : fallback
  }

  function css( style ) {
    return style ? `${
  Object.keys( style ).map( prop => `${
    prop.replace(/[A-Z]/g, char => `-${
      char.toLowerCase()
    }`)}: ${
      style[ prop ]
    }`).join('; ')}` : ''
  }

  function inspect( item ) {
    switch ( typeof item ) {
      case 'boolean':
      case 'function':
      case 'number':
        return item.toString()
      break
      case 'string':
        return item
      break
      default:
        return item instanceof RegExp
          ? item.toString()
          : JSON.stringify( item, null, Object.keys( item ).length > 4 ? 2 : 0 )
    }
  }

  class Garden {
    constructor( scope, options, _super ) {
      let fallback = { write: console.log };

      this._super = _super;

      this.options = {
        stream: ( this._super && this._super.options.stream ) || ( environment.node
          ? process.stdout
          : fallback ),
        outputType: ( this._super && this._super.options.outputType ) || environment.defaultOutputType,
        scope,
        scopeStyle: {
          color: scope && colorize( scope )
        },
        verbose: this._super && this._super.options.verbose,
        displayTime: this._super && this._super.options.displayTime,
        displayDate: this._super && this._super.options.displayDate
      };

      options && this._checkOptions( options );

      this._times = {};
      this._counts = {};
    }

    configure( update ) {
      this._checkOptions( update );
      return this
    }

    createScope( scope, options ) {
      if ( typeof scope !== 'string' && scope != null )
        throw new Error( 'scope must be a string or undefined' )

      return new Garden( scope, options, this )
    }

    createManager( scope, options ) {
      if ( typeof scope !== 'string' )
        throw new Error( 'manager name must be a string' )

      return new Manager( this.createScope( scope, options ) )
    }

    _checkOptions( update ) {
      if ( update.stream && update.stream.write ) {
        this.options.stream = update.stream;
        this.outputType = 'text';
      }

      if ( update.outputType ) {
        switch ( update.outputType ) {
          case 'ansi':
          case 'console':
          case 'html':
          case 'text':
            this.options.outputType = update.outputType;
          break
          default:
            throw this.typeerror( 'Invalid output type!' )
        }
      }

      if ( update._superScope ) this.options._superScope = update._superScope;
      if ( update.scopeStyle )  Object.assign( this.options.scopeStyle, update.scopeStyle );

      if ( update.verbose )     this.options.verbose = true;
      if ( update.displayDate ) this.options.displayDate = true;
      if ( update.displayTime ) this.options.displayTime = true;
    }

    assert( truthy, ...extra ) {
      if ( !truthy ) throw this.assertionerror( `${truthy} is not truthy!`, ...extra )
    }

    assert_eq( a, b, ...extra ) {
      if ( a !== b ) throw this.assertionerror( `${a} is not equal to ${b}!`, ...extra )
    }

    deny( falsey, ...extra ) {
      if ( falsey ) throw this.assertionerror( `${falsey} is not falsey!`, ...extra )
    }

    throws( throws, ...extra ) {
      try {
        throws();
      } catch ( error ) {
        return
      }

      throw this.assertionerror( `Function didn't throw!`, ...extra )
    }

    raw( ...messages ) {
      messages.forEach( message => this.options.stream.write( message ) );
    }

    styled( message, style ) {
      this.options.stream.write( ...this._transform([ this._style( message, style ) ]) );
    }

    log( ...messages ) {
      this._print({ type: 'log' }, ...messages );
    }

    info( ...messages ) {
      this._print({ type: 'info', style: { color: '#242f91' }  }, ...messages );
    }

    success( ...messages ) {
      this._print({ type: 'success', style: { color: '#40a456' } }, ...messages );
    }

    warning( ...messages ) {
      this._print({ type: 'warning', style: { color: '#ecb448' } }, ...messages );
    }

    warn( ...messages ) {
      this.warning( ...messages );
    }

    fail( ...messages ) {
      this._print({ type: 'fail', style: { color: '#ff1212' } }, ...messages );
    }

    debug( ...messages ) {
      if ( this.options.verbose ) {
        this._print({ type: 'debug', style: { color: '#ff8800' } }, ...messages );
        return true
      }
      return false
    }

    trace( message, ...extra ) {
      if ( this.options.verbose ) {
        let error = new Error( message );

        this._print({ type: 'trace', style: { color: '#ff8800' } }, `${message}\n${error.stack}\n`, ...extra );
        return true
      }
      return false
    }

    error( message, ...extra ) {
      let error = new Error( message );
      this._print({ type: 'error', style: { color: '#ff1212' } }, `${message}\n${error.stack}\n`, ...extra );
      return error
    }

    typeerror( message, ...extra ) {
      let error = new TypeError( message );
      this._print({ type: 'type error', style: { color: '#ff1212' } }, `${message}\n${error.stack}\n`, ...extra );
      return error
    }

    referenceerror( message, ...extra ) {
      let error = new ReferenceError( message );
      this._print({ type: 'reference error', style: { color: '#ff1212' } }, `${message}\n${error.stack}\n`, ...extra );
      return error
    }

    assertionerror( message, ...extra ) {
      let error = new Error( message );
      this._print({ type: 'assertion error', style: { color: '#ff1212' } }, `Assert failed! ${message}\n${error.stack}\n`, ...extra );
      return error
    }

    catch( error, ...extra ) {
      if ( !error || !error.stack ) error = new Error( error );
      if ( this.options.verbose ) this._print({ type: 'caught error', style: { color: '#ff1212' } }, `${error.name}: ${error.message}\n${error.stack}\n`, ...extra );
      return error
    }

    time( name ) {
      // If we are unable to get performance hooks, warn that the feature is broken.
      if ( !environment.performance ) return this.warn( 'Performance metrics are not available. `time` and `timeEnd` will not function.' )
      if ( arguments.length > 1 ) this.warn( '`.time` should only take one argument. Pass additional arguments to `.timeEnd`.' );

      // Count undefined and null both as null
      if ( name == null ) name = null;

      if ( !this._times[ name ] ) this._times[ name ] = [ environment.performance.now() ];
      else this._times[ name ].push( environment.performance.now() );
    }

    timeEnd( name, ...messages ) {
      // Count undefined and null both as null
      if ( name == null ) name = null;

      if ( !this._times[ name ] || !this._times[ name ].length ) {
        this.warn( `\`.timeEnd\` was called for ${toString( name, 'null' )} without a corresponding \`.time\`!`, ...messages );
        return
      }

      let ms = environment.performance.now() - this._times[ name ].pop();
      this._print({ type: toString( name, 'time' ) }, `took ${ms} milliseconds`, ...messages );
    }

    count( name, ...messages ) {
      // Count undefined and null both as null
      if ( name == null ) name = null;

      if ( !this._counts[ name ] ) this._counts[ name ] = 0;
      let count = ++this._counts[ name ];
      let pluralOrSingular = count === 1 ? 'time': 'times';

      this._print({ type: toString( name, 'count' ) }, `${count} ${pluralOrSingular}`, ...messages );
    }

    _scopePrefix( outputType = this.options.outputType ) {
      let prefix = this._super
        ? this._super._scopePrefix( outputType )
        : [];

      if ( this.options.scope ) prefix.push( this._style( `[${this.options.scope}]`, this.options.scopeStyle, outputType ) );
      return prefix
    }

    _print({ type, style }, ...messages ) {
      let output = this._scopePrefix();

      output.push( this._style( `[${type}]`, style || { color: '#5b5b5b' } ) );

      if ( this.options.displayDate )
        output.push( this._style( `[${new Date().toLocaleDateString()}]`, { color: '#999999' }) );
      if ( this.options.displayTime )
        output.push( this._style( `[${new Date().toLocaleTimeString()}]`, { color: '#999999' }) );

      messages.forEach( each => {
        typeof each === 'string'
         ? output.push( this._style( ` ${ each }` ) )
         : output.push( this._raw( each ) );
      });

      this.options.stream.write( ...this._transform( output ) );
    }

    _style( text, style, outputType = this.options.outputType ) {
      if ( outputType ==='ansi' ) {
        let wrap = chalk;
        if ( style ) {
          if ( style.backgroundColor ) wrap = wrap.bgHex( style.backgroundColor );
          if ( style.color ) wrap = wrap.hex( style.color );
          if ( style.fontWeight > 400 ) wrap = wrap.bold;
          if ( style.fontStyle === 'italic' ) wrap = wrap.italic;
          if ( style.textDecoration === 'underline' ) wrap = wrap.underline;
        }
        return {
          text: wrap( text ),
          format: null
        }
      } else if ( outputType === 'console' || outputType === 'html' ) {
        return {
          text,
          format: css( style )
        }
      } else {
        return {
          text,
          format: null
        }
      }
    }

    _raw( raw ) {
      return {
        raw
      }
    }

    _transform( output ) {
      let text = '';
      let formats = [];
      let raw = [];

      // In the browser we preserve raw objects to preserve interactive inspection.
      // (Think of the expand/collapse arrows in pretty much ever browser's DevTools.)
      // After one raw object, we must treat them all as raw, or things may be
      // printed in the wrong order, which is bad.
      let allRaw = false;

      output.forEach( part => {
        if ( 'raw' in part ) {
          if ( this.options.outputType === 'console' ) {
            raw.push( part.raw );
            allRaw = true;
            return
          } else {
            part.text = environment.node
              ? ` ${util.inspect( part.raw, { colors: this.options.outputType === 'ansi' } )}`
              : ` ${inspect( part.raw )}`;
          }
        }

        if ( 'text' in part ) {
          if ( this.options.outputType === 'console' ) {
            if ( allRaw ) raw.push( part.text );
            else if ( part.format != null ) {
              text += `%c${part.text}`;
              formats.push( part.format );
            } else {
              text += part.text;
            }
          } else if ( this.options.outputType === 'html' ) {
            text += `<span${ part.format ? ` style="${part.format}"` : '' }>${
            // We replace spaces with &nbsp;, but only if there is more than one
            part.text
              .replace( / {2,}/g, spaces => spaces.replace( / /g, '&nbsp;' ) )
              .replace( /\n/g, '<br />' )
          }</span>`;
          } else {
            text += part.text;
          }
        }
      });

      if ( this.options.outputType === 'ansi' || this.options.outputType === 'text' ) text += '\n';
      if ( this.options.outputType === 'html' ) text += '<br />';

      return [ text, ...formats, ...raw ]
    }
  }

  var gardens = Object.assign( new Garden(), { environment } );

  return gardens;

}));
//# sourceMappingURL=gardens.js.map
