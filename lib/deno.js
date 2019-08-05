import Garden from './garden.js';

const gardens = new Garden();

gardens.configureEnvironment({
  performance,
  style( text, style ) {
    if ( style ) {
      if ( style.backgroundColor ) {
        const r = parseInt( style.backgroundColor.substr( 1, 2 ), 16 );
        const g = parseInt( style.backgroundColor.substr( 3, 2 ), 16 );
        const b = parseInt( style.backgroundColor.substr( 5, 2 ), 16 );

        text = `\u001B[48;2;${ r };${ g };${ b }m${text}\u001B[49m`;
      }

      if ( style.color ) {
        const r = parseInt( style.color.substr( 1, 2 ), 16 );
        const g = parseInt( style.color.substr( 3, 2 ), 16 );
        const b = parseInt( style.color.substr( 5, 2 ), 16 );

        text = `\u001B[38;2;${ r };${ g };${ b }m${text}\u001B[39m`;
      }

      if ( style.fontWeight > 400 ) {
        text = `\u001B[1m${text}\u001B[22m`;
      }

      if ( style.fontStyle === 'italic' ) {
        text = `\u001B[3m${text}\u001B[23m`;
      }

      if ( style.textDecoration === 'underline' ) {
        text = `\u001B[4m${text}\u001B[24m`;
      }
    }

    return { text };
  },
  supportsColor: true,
  timingPrecision: 6
});

export default Object.assign(
  gardens, {
    environment: {
      deno: Deno.version
    }
  });
