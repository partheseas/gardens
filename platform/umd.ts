import gardens from '../lib/gardens';

const env = {
  browser: typeof window !== 'undefined'
    && typeof navigator !== 'undefined',
  node: typeof process !== 'undefined'
    && process.versions && process.versions.node
};
const hex = /^#[0-9a-f]{6}$/i;

if ( env.browser ) {
  const edge = parseFloat(
    ( navigator.userAgent.match( /Edge?\/([\d.]+)/ )
    || [ '', '0' ] )[ 1 ] );
  const supportsColor = !edge || edge >= 19;

  const hrt = typeof performance !== 'undefined';

  gardens.configureEnvironment({
    performance: hrt ? performance : null,
    supportsColor,
    timingPrecision: hrt ? 6 : 0
  });
}

else if ( env.node ) {
  const chalk = require( 'chalk' );
  const { performance } = require( 'perf_hooks' );
  const readline = require( 'readline' );
  const color = require( 'supports-color' );
  const { inspect } = require( 'util' );

  const supportsColor = color.stdout.hasBasic;

  gardens.configureEnvironment({
    defaultOutputType: 'ansi',
    defaultStream: process.stdout,
    inspect( item, options ) {
      return inspect( item, { colors: supportsColor && options.outputType === 'ansi' });
    },
    moveCursorBy( x, y ) {
      readline.moveCursor( process.stdout, x, y );
    },
    performance,
    style( text, style ) {
      if ( !style ) return { text };

      let wrap = chalk;

      if ( hex.test( style.backgroundColor ) ) wrap = wrap.bgHex( style.backgroundColor );
      if ( style.color ) wrap = wrap.hex( style.color );
      if ( style.fontStyle === 'italic' ) wrap = wrap.italic;
      if ( style.fontWeight > 400 ) wrap = wrap.bold;
      if ( style.textDecoration ) {
        wrap = wrap.underline;
        if ( style.textDecoration.includes( 'underline' ) ) wrap = wrap.underline;
        if ( style.textDecoration.includes( 'line-through' ) ) wrap = wrap.strikethrough;
      }

      return {
        text: wrap( text )
      };
    },
    supportsColor,
    timingPrecision: 6
  });
}

export default new gardens();
