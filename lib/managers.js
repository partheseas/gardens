export default class Manager {
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
      if ( typeof details[ i ] !== 'string' ) throw this.output.typeerror( 'Scope names must be all be strings' );
      const name = details[ i ];

      if ( name in cursor.nested ) {
        cursor = cursor.nested[ name ];
      } else {
        cursor = cursor.nested[ name ] = {
          default: cursor.default.createScope( name ),
          nested: {}
        };
      }
    }

    return cursor.default;
  }
}
