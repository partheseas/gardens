export default class Manager {
  constructor( garden, { useProxy }) {
    this.useProxy = useProxy;
    this.scopes = {
      default: garden,
      nested: {}
    };
  }

  scope( ...names ) {
    let cursor = this.scopes;

    for ( let i = 0; i < names.length; i++ ) {
      const name = names[ i ];

      if ( typeof name !== 'string' ) {
        throw this.scopes.default.typeerror( 'Scope names must all be strings' );
      }

      if ( name in cursor.nested ) {
        cursor = cursor.nested[ name ];
      }
      else {
        cursor = cursor.nested[ name ] = {
          default: cursor.default.createScope( name ),
          nested: {}
        };
      }
    }

    return this.useProxy
      ? cursor.default.bound()
      : cursor.default;
  }
}
