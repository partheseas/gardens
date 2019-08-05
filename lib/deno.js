import Garden from './garden.js';

const gardens = new Garden();

gardens.configureEnvironment({
  defaultOutputType: 'ansi',
  performance,
  style( text, style ) {
    if ( style && style.color ) {
      const r = parseInt( style.color.substr( 1, 2 ), 16 );
      const g = parseInt( style.color.substr( 3, 2 ), 16 );
      const b = parseInt( style.color.substr( 5, 2 ), 16 );
      return {
        text: `\u001B[38;2;${ r };${ g };${ b }m${text}\u001B[39m`
      };
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
