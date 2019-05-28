# Managers

## Why use managers?
Let's start with an example of the problem that managers seek to solve.

```JavaScript
// a.js
const garden = gardens.createScope( 'project', {
  scopeStyle: {
    color: '#43c872',
    fontDecoration: 'underline'
  }
}).createScope( 'a' )

// b.js
const garden = gardens.createScope( 'project', {
  scopeStyle: {
    color: '#43c872',
    fontDecoration: 'underline'
  }
}).createScope( 'a' )

// c/index.js
const garden = gardens.createScope( 'project', {
  scopeStyle: {
    color: '#43c872',
    fontDecoration: 'underline'
  }
}).createScope( 'c', {
  scopeStyle: {
    color: '#35c4b7',
    fontDecoration: 'underline'
  }
})

// c/d.js
const garden = gardens.createScope( 'project', {
  scopeStyle: {
    color: '#43c872',
    fontDecoration: 'underline'
  }
}).createScope( 'c', {
  scopeStyle: {
    color: '#35c4b7',
    fontDecoration: 'underline'
  }
}).createScope( 'd' )
```

By default, gardens takes a vary safe approach to scope naming, and assumes that each
call to `createScope` is supposed to actually *create* a scope. No caching, no scope
sharing, just freshly instantiated gardens. In the above code we create multiple nested
scopes in order to organize our code. The problem is that we have now created four
separate scopes named project and two nested scopes named c on two separate parents.
If we want to apply a custom color, output stream, or change any other configuration
options, we would have to do that four times to every single one of the 'project'
scopes. The lines above already feel long and laborious for what they do, and are
inefficient to maintain. If we needed to change the output stream of style we
would need to change it several times, or do various trickery to pass the options
or the gardens themselves between files. If you use a build system like Babel
or Rollup then things get complicated even further.

So, let's look at how we could fix the problem by using a manager.
```JavaScript
// scopes.js
const manager = gardens.createManager( 'project', {
  scopeStyle: {
    color: '#43c872',
    fontDecoration: 'underline'
  }
})

// a.js
const garden = manager.scope( 'a' )

// b.js
const garden = manager.scope( 'b' )

// c.js
const garden = manager.scope( 'c' ).configure({
  scopeStyle: {
    color: '#35c4b7',
    fontDecoration: 'underline'
  }
})

// d.js
const garden = manager.scope( 'c', 'd' )
```

In the above example all of the scopes that you would expect to be the same now
match correctly and are shared across files. Any configurations applied in one
place will also apply to the same scope in other places. All you need to do is
add a file that creates a manager and exposes it for others to use. This avoids any
circular dependency work arounds and makes scoping much more concise, readable,
and maintainable.

## Usage
That's it! Managers are a pretty simple feature. They just have a single method
that takes a list of names.

```JavaScript
const m = gardens.createManager( 'project' )
const garden = m.scope() // Returns the root 'project' scope
const gardena = m.scope( 'a' ) // Returns a nested 'b' scope
const gardenabcd = m.scope( 'a', 'b', 'c', 'd' ) // I think you get the idea
```
