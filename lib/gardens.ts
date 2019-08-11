// At a minimum, we need the console object to be defined since we
// rely on it as a sensible default.
if ( typeof console === 'undefined' ) {
  throw new Error( 'This version of gardens does not support this environment.' );
}

// The .js extension is necessary for compatibility with Deno.
import Manager from './managers.ts';

interface EnvironmentConfiguration {
  defaultOutputType: OutputType,
  defaultStream: WritableStreamish,
  debug: string,
  moveCursorBy: ( x: number, y: number ) => void,
  inspect: ( item: any, options: GardenOptions ) => string,
  performance: {
    now: () => number
  },
  style: ( text: string, style: CssObject ) => MessageContainer,
  supportsColor: boolean,
  timingPrecision: number
}

const environment: EnvironmentConfiguration = {
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
  style: css,
  supportsColor: false,
  timingPrecision: 0
};

// This should actually be a string, but TypeScript gets mad for some reason?
function colorize( scope: any ): string {
  let r = 50;
  let g = 50;
  let b = 50;

  for ( const char in scope ) {
    r = r * scope.charCodeAt( char ) ** 12 % 175 + 50;
    [ b, r, g ] = [ r, g, b ];
  }

  return `#${r.toString( 16 )}${g.toString( 16 )}${b.toString( 16 )}`;
}

function toString( from: any, fallback: string ): string {
  return from != null && typeof from.toString === 'function'
    ? from.toString()
    : fallback;
}

function css( text: string, style: CssObject ): StyledMessage {
  return {
    text,
    format: style ? `${
      Object.keys( style ).map( prop => `${
        prop.replace( /[A-Z]/g, char => `-${
          char.toLowerCase()
        }` )}: ${
          style[ prop ]
        }` ).join( '; ' )
    }` : ''
  };
}

function inspect( item: any ): string {
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

type BoundGarden = Exclude<Garden, 'createScope' | 'createManager' | 'bound'>;

export interface GardenOptions {
  readonly scope: string,
  stream: WritableStreamish,
  outputType: OutputType,
  supportsColor: boolean,
  timingPrecision: number,
  scopeStyle: CssObject,
  verbose: boolean,
  displayTime: boolean,
  displayDate: boolean
}

export interface ManagerOptions extends GardenOptions {
  useProxy: boolean;
}

export interface WritableStreamish {
  write( ...messages: any[] ): any
}

export type OutputType =
  | 'ansi'
  | 'console'
  | 'html'
  | 'text';

export interface CssObject {
  backgroundColor?: string,
  color?: string,
  fontStyle?: string,
  fontWeight?: number,
  textDecoration?: string
  [ property: string ]: string | number
}

export type Name =
  | symbol
  | string
  | number;

interface PrintType {
  type: string,
  style?: CssObject
}

type MessageContainer = RawMessage | StyledMessage;

interface RawMessage {
  raw: any
}

interface StyledMessage {
  text: string,
  // Only used for outputType 'console'. The CSS string that corresponds to
  // `text` and will be passed to console.log
  format?: string
}

// These are the correct types, but are unsupported by TypeScript and will cause errors
// to be thrown from tsc. If and when this ever gets fixed, we should go back to using
// these types again.

// interface TimesObject {
//   [ name: Name ]: number[]
// }
// interface CountsObject {
//   [ name: Name ]: number
// }

// These types are far less specific, but they actually compile without throwing errors.
type TimesObject = object;
type CountsObject = object;

export default class Garden {
  private _super: Garden;
  private options: GardenOptions;

  private _times: TimesObject;
  private _counts: CountsObject;

  /**
   *
   * @hidden
   * @param scope
   * @param options
   * @param _super
   */
  constructor( scope?: string, options?: Partial<GardenOptions>, _super?: Garden ) {
    if ( _super ) this._super = _super;

    this.options = {
      scope,
      stream: this._super
        && this._super.options.stream
        || environment.defaultStream,
      outputType: this._super
        && this._super.options.outputType
        || environment.defaultOutputType,
      supportsColor: this._super
        && this._super.options.supportsColor
        || environment.supportsColor,
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

  /**
   *
   * @hidden
   * @param update
   */
  static configureEnvironment( update: Partial<EnvironmentConfiguration> ) {
    // We use this instead of Object.assign so that we can pass keys in with
    // values of null/false/undefined and not overwrite the defaults.
    for ( const [ key, setting ] of Object.entries( update ) ) {
      if ( setting != null ) environment[ key ] = setting;
    }
  }

  /**
   *
   * @category Utility
   * @param scope
   * @param options
   */
  createScope( scope?: string, options?: Partial<GardenOptions> ) {
    if ( typeof scope !== 'string' && scope != null )
      throw new Error( 'scope must be a string or undefined' );

    return new Garden( scope, options, this );
  }

  /**
   *
   * @category Utility
   * @param scope
   * @param options
   */
  createManager( scope: string, options: Partial<ManagerOptions> = { useProxy: true }) {
    const { useProxy } = options;
    if ( typeof scope !== 'string' )
      throw new Error( 'manager name must be a string' );

    return new Manager( this.createScope( scope, options ), { useProxy });
  }

  /**
   * Returns a bound version of the garden, meaning that the methods do not need
   * need to be directly attached to the garden to function properly.
   *
   * For example, the following is how a typically garden would behave if you
   * detached one of its methods and tried to use it.
   * ```JavaScript
   * const { debug } = gardens.createScope();
   * debug( 'Hello!' );
   * ❌ TypeError: Cannot read property {...} of undefined "this".
   * ```
   *
   * A bound garden can be used that way with no problem!
   * ```JavaScript
   * const { debug } = gardens.createScope().bound();
   * debug( 'Hello!' );
   * → [debug] Hello!
   * ```
   *
   * It's also worth noting that when using a [[Manager]], gardens bound by default.
   * ```JavaScript
   * const { debug } = manager.scope( 'x', 'y', 'z' );
   * debug( 'Hello!' );
   * → [x][y][z][debug] Hello!
   * ```
   *
   * @category Utility
   */
  bound(): BoundGarden {
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

  /**
   *
   * @category Utility
   * @param update
   */
  configure( update: Partial<GardenOptions> ) {
    this._checkOptions( update );
    return this;
  }

  /**
   *
   * @hidden
   * @param update
   */
  private _checkOptions( update: Partial<GardenOptions> ) {
    if ( update.stream ) {
      if ( typeof update.stream.write === 'function' ) {
        this.options.stream = update.stream;
        this.options.outputType = 'text';
      }

      else {
        this.warn( 'Cannot set stream to an object without a write method.' );
      }
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

    if ( update.scopeStyle )  Object.assign( this.options.scopeStyle, update.scopeStyle );

    if ( 'verbose' in update ) this.options.verbose = !!update.verbose;
    if ( 'displayDate' in update ) this.options.displayDate = !!update.displayDate;
    if ( 'displayTime' in update ) this.options.displayTime = !!update.displayTime;
  }

  /**
   *
   * @category Assertion
   * @param value
   * @param messages
   */
  assert( value: any, ...messages: any[] ) {
    if ( !value ) throw this.assertionerror( `${value} is not truthy!`, ...messages );
  }

  /**
   *
   * @category Assertion
   * @param given
   * @param expected
   * @param messages
   */
  assert_eq( given: any, expected: any, ...messages: any[] ) {
    if ( given !== expected ) {
      throw this.assertionerror( `${given} is not equal to ${expected}!`, ...messages );
    }
  }

  /**
   *
   * @category Assertion
   * @param value
   * @param messages
   */
  deny( value: any, ...messages: any[] ) {
    if ( value ) throw this.assertionerror( `${value} is not falsy!`, ...messages );
  }

  /**
   *
   * @category Assertion
   * @param throws
   * @param messages
   */
  throws( throws: () => never, ...messages: any[] ) {
    try {
      throws();
    }
    catch ( error ) {
      return;
    }

    throw this.assertionerror( `Function didn't throw!`, ...messages );
  }

  /**
   *
   * @category Unscoped
   * @param messages
   */
  raw( ...messages: any[] ) {
    messages.forEach( message => this.options.stream.write( message ) );
  }

  /**
   *
   * @category Unscoped
   * @param message
   * @param style
   */
  styled( message: string, style: CssObject ) {
    this.options.stream.write( ...this._transform( [ this._style( message, style ) ] ) );
  }

  /**
   *
   * @category Informational
   * @param messages
   */
  log( ...messages: any[] ) {
    this._print({ type: 'log' }, ...messages );
  }

  /**
   *
   * @category Informational
   * @param messages
   */
  info( ...messages: any[] ) {
    this._print({ type: 'info', style: { color: '#242f91' }  }, ...messages );
  }

  /**
   *
   * @category Informational
   * @param messages
   */
  success( ...messages: any[] ) {
    this._print({ type: 'success', style: { color: '#40a456' } }, ...messages );
  }

  /**
   *
   * @category Informational
   * @param messages
   */
  warning( ...messages: any[] ) {
    this._print({ type: 'warning', style: { color: '#ecb448' } }, ...messages );
  }

  /**
   *
   * @category Informational
   * @param messages
   */
  warn( ...messages: any[] ) {
    this.warning( ...messages );
  }

  /**
   * @category Informational
   *
   */
  failure( ...messages: any[] ) {
    this._print({ type: 'failure', style: { color: '#ff1212' } }, ...messages );
  }

  /**
   *
   * @category Informational
   * @param messages
   */
  fail( ...messages: any[] ) {
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

  /**
   *
   * @category Debugging
   * @param messages
   */
  debug( ...messages: any[] ) {
    if ( this.options.verbose ) {
      this._print({ type: 'debug', style: { color: '#ff8800' } }, ...messages );
      return true;
    }
    return false;
  }

  /**
   *
   * @category Debugging
   * @param errorMessage
   * @param messages
   */
  trace( errorMessage: string, ...messages: any[] ) {
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

  /**
   *
   * @category Error
   * @param errorMessage
   * @param messages
   */
  error( errorMessage: string, ...messages: any[] ) {
    const error = new Error( errorMessage );
    this._print(
      { type: 'error', style: { color: '#ff1212' } },
      `${errorMessage}\n${error.stack}\n`,
      ...messages );
    return error;
  }

  /**
   *
   * @category Error
   * @param errorMessage
   * @param messages
   */
  typeerror( errorMessage: string, ...messages: any[] ) {
    const error = new TypeError( errorMessage );
    this._print(
      { type: 'type error', style: { color: '#ff1212' } },
      `${errorMessage}\n${error.stack}\n`,
      ...messages );
    return error;
  }

  /**
   *
   * @category Error
   * @param errorMessage
   * @param messages
   */
  referenceerror( errorMessage: string, ...messages: any[] ) {
    const error = new ReferenceError( errorMessage );
    this._print(
      { type: 'reference error', style: { color: '#ff1212' } },
      `${errorMessage}\n${error.stack}\n`,
      ...messages );
    return error;
  }

  /**
   *
   * @category Error
   * @param errorMessage
   * @param messages
   */
  assertionerror( errorMessage: string, ...messages: any[] ) {
    const error = new Error( errorMessage );
    this._print(
      { type: 'assertion error', style: { color: '#ff1212' } },
      `Assert failed! ${errorMessage}\n${error.stack}\n`,
      ...messages );
    return error;
  }

  /**
   * @category Error
   *
   */
  catch( errorMessage: Error | string, ...messages: any[] ): Error {
    const error = errorMessage instanceof Error
      ? errorMessage
      : new Error( errorMessage );

    if ( this.options.verbose ) {
      this._print(
        { type: 'caught error', style: { color: '#ff1212' } },
        `${error.name}: ${error.message}\n${error.stack}\n`,
        ...messages
      );
    }

    return error;
  }

  /**
   *
   * @category Informational
   * @param name
   */
  time( name: Name ) {
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

  /**
   *
   * @category Informational
   * @param name
   * @param messages
   */
  timeEnd( name: Name, ...messages: any[] ) {
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

  /**
   *
   * @category Informational
   * @param name
   * @param messages
   */
  count( name: Name, ...messages: any[] ) {
    // Count undefined and null both as null
    if ( name == null ) name = null;

    if ( !this._counts[ name ] ) this._counts[ name ] = 0;
    const count = ++this._counts[ name ];
    const pluralOrSingular = count === 1 ? 'time': 'times';

    this._print({ type: toString( name, 'count' ) }, `${count} ${pluralOrSingular}`, ...messages );
  }

  /**
   *
   * @category Informational
   * @param name
   */
  countReset( name: Name ) {
    // Count undefined and null both as null
    if ( name == null ) name = null;

    this._counts[ name ] = 0;
  }

  /**
   *
   * @hidden
   * @param outputType
   */
  private _scopePrefix( outputType = this.options.outputType ): MessageContainer[] {
    const prefix = this._super
      ? this._super._scopePrefix( outputType )
      : [];

    if ( this.options.scope ) {
      prefix.push( this._style( `[${this.options.scope}]`, this.options.scopeStyle, outputType ) );
    }
    return prefix;
  }

  /**
   *
   * @hidden
   * @param printType
   * @param messages
   */
  private _print({ type, style }: PrintType, ...messages: any[] ) {
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

  /**
   *
   * @hidden
   * @param text
   * @param style
   * @param outputType
   */
  private _style(
    text: string,
    style?: CssObject,
    outputType = this.options.outputType
  ): MessageContainer {
    if ( outputType === 'ansi' || outputType === 'console' ) {
      return environment.supportsColor
        ? environment.style( text, style )
        : { text };
    }
    else if ( outputType === 'html' ) {
      return css( text, style );
    }
    else {
      return {
        text,
        format: null
      };
    }
  }

  /**
   *
   * @hidden
   * @param output
   */
  private _transform( output: MessageContainer[] ) {
    // The beginning text portion of the output
    let text = '';
    // Potentially the CSS strings if the outputType is 'console' and
    // color is supported
    const formats: string[] = [];
    // The raw objects to follow the initial string
    const raw: any[] = [];

    // In the browser we preserve raw objects to preserve interactive inspection.
    // (Think of the expand/collapse arrows in pretty much ever browser's DevTools.)
    // After one raw object, we must treat them all as raw, or things may be
    // printed in the wrong order, which is bad.
    let allRaw = false;

    output.forEach( part => {
      if ( 'raw' in part ) {
        if ( this.options.outputType === 'console' ) {
          raw.push( part.raw );
          // Enforce all parts being raw
          allRaw = true;
          return;
        }
        else {
          part = {
            text: ` ${environment.inspect( part.raw, this.options )}`
          };
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

    // Arguments as the will be passed to the stream
    return [ text, ...formats, ...raw ];
  }
}
