export as namespace gardens;

declare interface EnvironmentConfiguration {
  defaultOutputType: OutputType,
  defaultStream: WritableStreamish,
  debug: string,
  inspect: ( item: any, options: GardenOptions ) => string,
  performance: {
    now: () => number
  },
  style: ( text: string, style: CssObject ) => StyledMessage,
  supportsColor: boolean,
  timingPrecision: number
}

declare class Manager {
  private scopes: ManagerScope;
  scope( ...names: string[] ): Garden;
}

declare interface ManagerScope {
  default: Garden,
  nested: {
    [ name: string ]: ManagerScope
  }
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

declare interface GardenOptions {
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

declare interface WritableStreamish {
  write( ...messages: any[] ): any
}

declare type OutputType =
  | 'ansi'
  | 'console'
  | 'html'
  | 'text';

declare interface CssObject {
  backgroundColor: string,
  color: string,
  fontStyle: string,
  fontWeight: number,
  textDecoration: string
  [ property: string ]: string | number
}

declare type Name =
  | symbol
  | string
  | number;

declare interface PrintType {
  type: string,
  style?: CssObject
}

declare interface StyledMessage {
  text: string,
  // Only used for outputType 'console'. The CSS string that corresponds to
  // `text` and will be passed to console.log
  format?: string
}


export default class Garden {
  private _super: Garden;
  private options: GardenOptions;
  private _times: TimesObject;
  private _counts: CountsObject;
  private _env: EnvironmentConfiguration;

  constructor( scope?: string, options?: Partial<GardenOptions>, _super?: Garden );
  static configureEnvironment( update: Partial<EnvironmentConfiguration> ): void;
  
  createScope( scope?: string, options?: Partial<GardenOptions> ): Garden;
  createManager( scope: string, options?: Partial<GardenOptions> ): Manager;
  bound(): Omit<this, 'createScope' | 'createManager' | 'bound'>;

  configure( update: Partial<GardenOptions> ): this;
  private _checkOptions( update: Partial<GardenOptions> ): void;

  assert( value: boolean, ...messages: any[] ): void;
  assert_eq( a: any, b: any, ...messages: any[] ): void;
  deny( value: boolean, ...messages: any[] ): void;
  throws( throws: () => never, ...messages: any[] ): void;

  raw( ...messages: any[] ): void;
  styled( message: any, style: CssObject ): void;

  log( ...messages: any[] ): void;
  info( ...messages: any[] ): void;
  success( ...messages: any[] ): void;
  warning( ...messages: any[] ): void;
  warn( ...messages: any[] ): void;
  failure( ...messages: any[] ): void;
  fail( ...messages: any[] ): void;

  debug( ...messages: any[] ): boolean;
  trace( errorMessage: string, ...messages: any[] ): boolean;

  error( errorMessage: string, ...messages: any[] ): Error;
  typeerror( errorMessage: string, ...messages: any[] ): TypeError;
  referenceerror( errorMessage: string, ...messages: any[] ): ReferenceError;
  assertionerror( errorMessage: string, ...messages: any[] ): Error;
  
  catch( error: Error | any, ...messages: any[] ): Error;

  time( name: Name | null ): void;
  timeEnd( name: Name | null, ...messages: any[] ): void;
  count( name: Name | null, ...messages: any[] ): void;
  countReset( name: Name ): void;

  private _scopePrefix( outputType: OutputType ): StyledMessage[];
  private _print( type: PrintType, ...messages: any[] ): void;
  private _style( text, style, outputType: OutputType ): StyledMessage;
  private _transform( output: StyledMessage[] ): any[];
}
