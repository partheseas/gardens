// The .js extension is necessary for compatibility with Deno.
import Garden from './gardens.ts';

interface ManagerScope {
  default: Garden,
  nested: {
    [ name: string ]: ManagerScope
  }
}

/**
 * ## Managers
 *
 * ### Why use managers?
 * Let's start with an example of the problem that managers seek to solve. For
 * simplicity, I'm going to use ESModules syntax.
 *
 * ```JavaScript
 * // a.js
 * import gardens from 'gardens'
 * const garden = gardens.createScope( 'project', {
 *   scopeStyle: {
 *     color: '#43c872',
 *     fontDecoration: 'underline'
 *   }
 * }).createScope( 'a' )
 *
 * // b.js
 * import gardens from 'gardens'
 *  const garden = gardens.createScope( 'project',
 *   scopeStyle: {
 *     color: '#43c872',
 *     fontDecoration: 'underline'
 *   }
 * }).createScope( 'a' )
 *
 * // c/index.js
 * import gardens from 'gardens'
 * const garden = gardens.createScope( 'project', {
 *   scopeStyle: {
 *     color: '#43c872',
 *     fontDecoration: 'underline'
 *   }
 * }).createScope( 'c', {
 *   scopeStyle: {
 *     color: '#35c4b7',
 *     fontDecoration: 'underline'
 *   }
 * })
 *
 * // c/d.js
 * import gardens from 'gardens'
 * const garden = gardens.createScope( 'project', {
 *   scopeStyle: {
 *     color: '#43c872',
 *     fontDecoration: 'underline'
 *   }
 * }).createScope( 'c', {
 *   scopeStyle: {
 *     color: '#35c4b7',
 *     fontDecoration: 'underline'
 *   }
 * }).createScope( 'd' )
 * ```
 *
 * By default, gardens takes a vary safe approach to scope naming, and assumes that each
 * call to `createScope` is supposed to actually *create* a scope. No caching, no scope
 * sharing, just freshly instantiated gardens. In the above code we create multiple nested
 * scopes in order to organize our code. The problem is that we have now created four
 * separate scopes named project and two nested scopes named c on two separate parents.
 * If we want to apply a custom color, output stream, or change any other configuration
 * options, we would have to do that four times to every single one of the 'project'
 * scopes. The lines above already feel long and laborious for what they do, and are
 * inefficient to maintain. If we needed to change the output stream of style we
 * would need to change it several times, or do various trickery to pass the options
 * or the gardens themselves between files. If you use a build system like Babel
 * or Rollup then things get complicated even further.
 *
 * So, let's look at how we could fix the problem by using a manager.
 * ```JavaScript
 * // gardens.config.js
 * import gardens from 'gardens';
 *
 * const manager = gardens.createManager( 'project', {
 *   scopeStyle: {
 *     color: '#43c872',
 *     fontDecoration: 'underline'
 *   }
 * });
 *
 * manager.scope( 'c' ).options({
 *   scopeStyle: {
 *     color: '#35c4b7',
 *     fontDecoration: 'underline'
 *   }
 * });
 *
 * export default manager;
 *
 * // a.js
 * import manager from './scopes'
 * const garden = manager.scope( 'a' )
 *
 * // b.js
 * import manager from './scopes'
 * const garden = manager.scope( 'b' )
 *
 * // c/index.js
 * import manager from './scopes'
 * const garden = manager.scope( 'c' )
 *
 * // c/d.js
 * import manager from './scopes'
 * const garden = manager.scope( 'c', 'd' )
 * ```
 *
 * In the above example all of the scopes that you would expect to be the same now
 * match correctly and are shared across files. Any configurations applied in one
 * place will also apply to the same scope in other places. All you need to do is
 * add a file that creates a manager and exposes it for others to use. This avoids any
 * circular dependency work arounds and makes scoping much more concise, readable,
 * and maintainable. You can also set all of your scope options in one consistent place,
 * rather than multiple different files. If you need to set up a complicated custom
 * stream for your output then you do it all in one place.
 *
 * It's important to note that only scopes created by `manager.scope` will be managed,
 * and that by default managed gardens are bound.
 *
 * ## Usage
 * That's it! Managers are a pretty simple feature. They just have a single method
 * that takes a list of names.
 *
 * ```JavaScript
 * const m = gardens.createManager( 'project', options ) // Same options as any other garden
 * const garden = m.scope() // Returns the root 'project' scope
 * const gardena = m.scope( 'a' ) // Returns the nested scope 'a'
 * const gardenabcd = m.scope( 'a', 'b', 'c', 'd' ) // I think you get the idea
 * ```
 */
export default class Manager {
  private readonly useProxy: boolean;
  private scopes: ManagerScope;

  constructor( garden: Garden, { useProxy }) {
    this.useProxy = useProxy;
    this.scopes = {
      default: garden,
      nested: {}
    };
  }

  scope( ...names: string[] ) {
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
