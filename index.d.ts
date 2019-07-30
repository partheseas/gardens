export as namespace gardens;

export interface Environment {
  browser: boolean,
  electron: boolean,
  node: boolean,
  performance: any,
  defaultOutputType: OutputType // XXX: Not robust
}

export class Manager {
  private scopes: object;
  scope( ...names: string[] ): Garden;
}

export class Garden {
  private _super: Garden;
  private options: GardenOptions;
  private _times: TimesObject;
  private _counts: CountsObject;

  configure( update: GardenOptions ): Garden;

  private _checkOptions( update: GardenOptions ): void;
  
  createScope( scope: string, options?: GardenOptions ): Garden;
  createManager( scope: string, options?: GardenOptions ): Manager;

  assert( value: boolean, ...messages: any[] ): void;
  assert_eq( a: any, b: any, ...messages: any[] ): void;
  deny( value: boolean, ...messages: any[] ): void;
  throws( throws: () => never, ...messages: any[] ): void;

  raw( ...messages: any[] ): void;
  styled( message: any, style: CssObject ): void; // XXX: Not robust

  log( ...messages: any[] ): void;
  info( ...messages: any[] ): void;
  success( ...messages: any[] ): void;
  warning( ...messages: any[] ): void;
  warn( ...messages: any[] ): void;
  fail( ...messages: any[] ): void;

  debug( ...messages: any[] ): boolean;
  trace( errorMessage: string, ...messages: any[] ): boolean;

  error( errorMessage: string, ...messages: any[] ): Error;
  typeerror( errorMessage: string, ...messages: any[] ): TypeError;
  referenceerror( errorMessage: string, ...messages: any[] ): ReferenceError;
  assertionerror( errorMessage: string, ...messages: any[] ): Error;
  
  catch( error: Error | any, ...messages: any[] ): Error;

  time( name: Name ): void;
  timeEnd( name: Name, ...messages: any[] ): void;
  count( name: Name, ...messages: any[] ): void;

  private _scopePrefix( outputType: OutputType ): string; // XXX: It doesn't actually return a string
  private _print( type: PrintType, ...messages: any[] ): void;
  private _style( text, style, outputType: OutputType ): StyledMessage;
  private _transform( output: StyledMessage[] ): any[];
}

interface TimesObject {
  [ name: Name ]: number[]
}

interface CountsObject {
  [ name: Name ]: number
}

export interface GardenOptions {
  scope?: string,
  stream?: WritableStreamish,
  outputType?: OutputType,
  timingPrecision?: number,
  scopeStyle?: CssObject, // XXX: Not robust
  verbose?: boolean,
  displayTime?: boolean,
  displayDate?: boolean
}

export interface WritableStreamish {
  write( ...messages: any[] ): any
}

export type OutputType =
  | 'ansi'
  | 'console'
  | 'html'
  | 'text'

export type Name =
  | symbol
  | string
  | null

interface PrintType {
  type: string,
  style: any // XXX: Fix
}

interface StyledMessage {
  raw: any,
  text: string,
  format: any // XXX: Fix
}

// The type of our export has to be declared seperately, since you
// can't really declare the export directly.
declare const gardens: Garden & { environment };
export = gardens;
