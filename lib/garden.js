// At a minimum, we need the console object to be defined since we
// rely on it as a sensible default.
if ( typeof console === 'undefined' ) {
  throw new Error( 'This version of gardens does not support this environment.' );
}

// The .js extension is necessary for compatibility with Deno.
import Manager from './managers.js';

const environment = {
  defaultOutputType: 'console',
  defaultStream: {
    write: console.log
  },
  debug: '',
  moveCursorBy: () => null,
  inspect,
  performance: {
    now: Date.now
  },
  style: item =>
    typeof item === 'string'
      ? { text: item }
      : { raw: item },
  supportsColor: false,
  timingPrecision: 0
};

function colorize( scope ) {
  let r = 50;
  let g = 50;
  let b = 50;

  for ( const char in scope ) {
    r = r * scope.charCodeAt( char ) ** 12 % 175 + 50;
    [ b, r, g ] = [ r, g, b ];
  }

  return `#${r.toString( 16 )}${g.toString( 16 )}${b.toString( 16 )}`;
}

function toString( from, fallback ) {
  return from != null && typeof from.toString === 'function'
    ? from.toString()
    : fallback;
}

function inspect( item ) {
  switch ( typeof item ) {
    case 'boolean':
    case 'function':
    case 'number':
      return item.toString();
    case 'string':
      return item;
    default:
      return item instanceof RegExp
        ? item.toString()
        : JSON.stringify( item, null, Object.keys( item ).length > 4 ? 2 : 0 );
  }
}

export default class Garden {
  constructor( scope, options, _super ) {
    if ( _super ) this._super = _super;

    this.options = {
      scope,
      stream: this._super
        && this._super.options.stream
        || environment.defaultStream,
      outputType: this._super
        && this._super.options.outputType
        || environment.defaultOutputType,
      timingPrecision: this._super
        && this._super.options.timingPrecision
        || environment.timingPrecision,
      scopeStyle: {
        color: scope && colorize( scope )
      },
      verbose: this._super && this._super.options.verbose
        || environment.debug.includes( scope ),
      displayTime: this._super && this._super.options.displayTime || false,
      displayDate: this._super && this._super.options.displayDate || false
    };

    options && this._checkOptions( options );

    this._times = {};
    this._counts = {};
  }

  static configureEnvironment( update ) {
    // We use this instead of Object.assign so that we can pass keys in with
    // values of null/false/undefined and not overwrite the defaults.
    for ( const [ key, setting ] of Object.entries( update ) ) {
      if ( setting == null ) environment[ key ] = setting;
    }
  }

  createScope( scope, options ) {
    if ( typeof scope !== 'string' && scope != null )
      throw new Error( 'scope must be a string or undefined' );

    return new Garden( scope, options, this );
  }

  createManager( scope, options ) {
    const { useProxy } = options;
    if ( typeof scope !== 'string' )
      throw new Error( 'manager name must be a string' );

    return new Manager( this.createScope( scope, options ), { useProxy });
  }

  bound() {
    return new Proxy( this, {
      get( self, method ) {
        // Cannot get a bound instance of a bound garden, or use a
        // bound garden as a parent.
        if ( method === 'createScope'
          || method === 'createManager'
          || method === 'bound' ) {
          self.warn( `Bound gardens can not use method '${method}'.` );
          return () => null;
        }

        return typeof self[ method ] === 'function'
          ? self[ method ].bind( self )
          : self[ method ];
      }
    });
  }

  configure( update ) {
    this._checkOptions( update );
    return this;
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
          break;
        default:
          throw this.typeerror( 'Invalid output type!' );
      }
    }

    if ( typeof update.timingPrecision === 'number' ) {
      this.options.timingPrecision = update.timingPrecision;
    }

    if ( update._superScope ) this.options._superScope = update._superScope;
    if ( update.scopeStyle )  Object.assign( this.options.scopeStyle, update.scopeStyle );

    if ( 'verbose' in update ) this.options.verbose = !!update.verbose;
    if ( 'displayDate' in update ) this.options.displayDate = !!update.displayDate;
    if ( 'displayTime' in update ) this.options.displayTime = !!update.displayTime;
  }

  assert( value, ...messages ) {
    if ( !value ) throw this.assertionerror( `${value} is not truthy!`, ...messages );
  }

  assert_eq( a, b, ...messages ) {
    if ( a !== b ) throw this.assertionerror( `${a} is not equal to ${b}!`, ...messages );
  }

  deny( value, ...messages ) {
    if ( value ) throw this.assertionerror( `${value} is not falsy!`, ...messages );
  }

  throws( throws, ...messages ) {
    try {
      throws();
    }
    catch ( error ) {
      return;
    }

    throw this.assertionerror( `Function didn't throw!`, ...messages );
  }

  raw( ...messages ) {
    messages.forEach( message => this.options.stream.write( message ) );
  }

  styled( message, style ) {
    this.options.stream.write( ...this._transform( [ this._style( message, style ) ] ) );
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

  failure( ...messages ) {
    this._print({ type: 'failure', style: { color: '#ff1212' } }, ...messages );
  }

  fail( ...messages ) {
    this.failure( ...messages );
  }

  // pending( message, handle ) {
  //   this._print({ type: 'pending', style: { color: '#ecb448' } }, message );
  //   if ( this.options.outputType === 'ansi' ) environment.moveCursorBy( 0, -1 );

  //   if ( !handle ) return null;
  //   return new Promise( ( fulfill, reject ) => {
  //     new Promise( handle ).then(
  //       ( ...success ) => {
  //         this.success( message );
  //         fulfill( ...success );
  //       },
  //       ( ...caught ) => {
  //         this.fail( message );
  //         reject( ...caught );
  //       }
  //     );
  //   });
  // }

  debug( ...messages ) {
    if ( this.options.verbose ) {
      this._print({ type: 'debug', style: { color: '#ff8800' } }, ...messages );
      return true;
    }
    return false;
  }

  trace( errorMessage, ...messages ) {
    if ( this.options.verbose ) {
      const error = new Error( errorMessage );

      this._print(
        { type: 'trace', style: { color: '#ff8800' } },
        `${errorMessage}\n${error.stack}\n`,
        ...messages
      );
      return true;
    }
    return false;
  }

  error( errorMessage, ...messages ) {
    const error = new Error( errorMessage );
    this._print(
      { type: 'error', style: { color: '#ff1212' } },
      `${errorMessage}\n${error.stack}\n`,
      ...messages );
    return error;
  }

  typeerror( errorMessage, ...messages ) {
    const error = new TypeError( errorMessage );
    this._print(
      { type: 'type error', style: { color: '#ff1212' } },
      `${errorMessage}\n${error.stack}\n`,
      ...messages );
    return error;
  }

  referenceerror( errorMessage, ...messages ) {
    const error = new ReferenceError( errorMessage );
    this._print(
      { type: 'reference error', style: { color: '#ff1212' } },
      `${errorMessage}\n${error.stack}\n`,
      ...messages );
    return error;
  }

  assertionerror( errorMessage, ...messages ) {
    const error = new Error( errorMessage );
    this._print(
      { type: 'assertion error', style: { color: '#ff1212' } },
      `Assert failed! ${errorMessage}\n${error.stack}\n`,
      ...messages );
    return error;
  }

  catch( error, ...messages ) {
    if ( !error || !error.stack ) error = new Error( error );
    if ( this.options.verbose ) {
      this._print(
        { type: 'caught error', style: { color: '#ff1212' } },
        `${error.name}: ${error.message}\n${error.stack}\n`,
        ...messages
      );
    }
    return error;
  }

  time( name ) {
    if ( arguments.length > 1 ) {
      this.warn(
        `'.time' should only take one argument. Pass additional arguments to '.timeEnd'.`
      );
    }

    // Count undefined and null both as null
    if ( name == null ) name = null;

    // If we haven't yet set up this time scope, initialize to an array with one entry.
    if ( !this._times[ name ] ) this._times[ name ] = [ environment.performance.now() ];
    else this._times[ name ].push( environment.performance.now() );
  }

  timeEnd( name, ...messages ) {
    // Count undefined and null both as null
    if ( name == null ) name = null;

    if ( !this._times[ name ] || !this._times[ name ].length ) {
      this.warn(
        `'.timeEnd' was called for ${toString( name, 'null' )} without first calling '.time'!`,
        ...messages
      );
      return;
    }

    const ms = environment.performance.now() - this._times[ name ].pop();
    this._print(
      { type: toString( name, 'time' ) },
      `${
        this.options.timingPrecision
          ? ms.toPrecision( this.options.timingPrecision ) : ms
      }ms`,
      ...messages
    );
  }

  count( name, ...messages ) {
    // Count undefined and null both as null
    if ( name == null ) name = null;

    if ( !this._counts[ name ] ) this._counts[ name ] = 0;
    const count = ++this._counts[ name ];
    const pluralOrSingular = count === 1 ? 'time': 'times';

    this._print({ type: toString( name, 'count' ) }, `${count} ${pluralOrSingular}`, ...messages );
  }

  countReset( name ) {
    // Count undefined and null both as null
    if ( name == null ) name = null;

    this._counts[ name ] = 0;
  }

  _scopePrefix( outputType = this.options.outputType ) {
    const prefix = this._super
      ? this._super._scopePrefix( outputType )
      : [];

    if ( this.options.scope ) {
      prefix.push( this._style( `[${this.options.scope}]`, this.options.scopeStyle, outputType ) );
    }
    return prefix;
  }

  _print({ type, style }, ...messages ) {
    const output = this._scopePrefix();

    output.push( this._style( `[${type}]`, style || { color: '#5b5b5b' }) );

    if ( this.options.displayDate )
      output.push( this._style( `[${new Date().toLocaleDateString()}]`, { color: '#999999' }) );
    if ( this.options.displayTime )
      output.push( this._style( `[${new Date().toLocaleTimeString()}]`, { color: '#999999' }) );

    messages.forEach( each => {
      typeof each === 'string'
        ? output.push( this._style( ` ${ each }` ) )
        : output.push({
          raw: each
        });
    });

    this.options.stream.write( ...this._transform( output ) );
  }

  _style( text, style, outputType = this.options.outputType ) {
    if ( outputType === 'ansi' || outputType === 'console' ) {
      return environment.supportsColor
        ? environment.style( text, style )
        : { text };
    }
    else if ( outputType === 'html' ) {
      return environment.style( text, style );
    }
    else {
      return {
        text,
        format: null
      };
    }
  }

  _transform( output ) {
    let text = '';
    const formats = [];
    const raw = [];

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
          return;
        }
        else {
          part.text = ` ${environment.inspect( part.raw, this.options )}`;
        }
      }

      if ( 'text' in part ) {
        if ( this.options.outputType === 'console' ) {
          if ( allRaw ) raw.push( part.text );
          else if ( part.format != null ) {
            text += `%c${ part.text }`;
            formats.push( part.format );
          }
          else {
            text += part.text;
          }
        }
        else if ( this.options.outputType === 'html' ) {
          text += `<span${ part.format ? ` style="${part.format}"` : '' }>${
            // We replace spaces with &nbsp;, but only if there is more than one
            part.text
              .replace( / {2,}/g, spaces => spaces.replace( / /g, '&nbsp;' ) )
              .replace( /\n/g, '<br />' )
          }</span>`;
        }
        else {
          text += part.text;
        }
      }
    });

    if ( this.options.outputType === 'ansi' || this.options.outputType === 'text' ) text += '\n';
    if ( this.options.outputType === 'html' ) text += '<br />';

    return [ text, ...formats, ...raw ];
  }
}
