import Garden from './garden';

const gardens = new Garden();

const env = {
  browser: typeof window !== 'undefined'
    && typeof navigator !== 'undefined',
  electron: typeof process !== 'undefined'
    && process.versions && process.versions.electron,
  node: typeof process !== 'undefined'
    && process.versions && process.versions.node
};

if ( env.browser ) {
  const edge = parseFloat(
    ( navigator.userAgent.match( /Edge?\/([\d.]+)/ )
    || [ '', '0' ] )[ 1 ] );
  const supportsColor = !edge || edge >= 19;

  const hrt = typeof performance !== 'undefined';
  const polyfill = gardens.env.performance;

  gardens.configureEnvironment({
    performance: hrt ? performance : polyfill,
    style( text, style ) {
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
    },
    supportsColor,
    timingPrecision: hrt ? 6 : 0
  });
}

else if ( env.node ) {
  const chalk = require( 'chalk' );
  const { performance } = require( 'perf_hooks' );
  const color = require( 'supports-color' );
  const { inspect } = require( 'util' );

  const supportsColor = color.stdout.hasBasic;

  gardens.configureEnvironment({
    defaultOutputType: 'ansi',
    defaultStream: process.stdout,
    inspect( item, options ) {
      return inspect( item, { colors: supportsColor && options.outputType === 'ansi' });
    },
    performance,
    style( text, style ) {
      if ( !style ) return { text };

      let wrap = chalk;

      if ( style.backgroundColor ) wrap = wrap.bgHex( style.backgroundColor );
      if ( style.color ) wrap = wrap.hex( style.color );
      if ( style.fontWeight > 400 ) wrap = wrap.bold;
      if ( style.fontStyle === 'italic' ) wrap = wrap.italic;
      if ( style.textDecoration === 'underline' ) wrap = wrap.underline;

      return {
        text: wrap( text )
      };
    },
    supportsColor,
    timingPrecision: 6
  });
}



export default Object.assign(
  gardens, {
    environment: env
  }
);
