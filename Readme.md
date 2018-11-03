# Gardens
Gardens make it easier to trace the flow of your code by always printing
the name of the scope that you are logging from. A garden can be used interchangeably
with `console`, and will work in Node and all modern browsers.

## Usage
```JavaScript
const garden = require( 'gardens' )
const named = new garden.createScope( 'named garden!' )
```

### Configuration
Configurations can be set per instance, and updated at any time.

```JavaScript
garden.configure({
  scopeStyle: {
    color: '#abacat',
    fontWeight: 700
  },
  verbose: true,
  displayDate: true,
  displayTime: true
})
```

### log, warn, and warning
These methods all just dump the arguments given out to the console like you would expect. The
output is prefixed with the garden name and output type. (log or warning)
```JavaScript
// These are all for general logging
garden.log( 'message' )
garden.info( 'new message' )
garden.warn( 'uhh oh' )
garden.warning( 'also uhh oh' )
```

### raw
Passes all given arguments directly to the stream (or console), without scopes, time stamps, or
any formatting. As the name implies, it just prints raw data.

### debug and trace
The debug method is similar to `log`, but it will only print if
`garden.options.verbose` is set to true. If this is `null`ish then
the call will do nothing.

The story for trace is similar, though it behaves more like `catch` than `log`, meaning
that if it is verbose, it will print a call stack.
```JavaScript
garden.configure({ verbose: true })
garden.debug( 'interesting information!' )
garden.trace( 'look at my call stack!' )
```

### error, typeerror, referenceerror, and catch
These methods will automagically create an `Error`, `TypeError` or `ReferenceError` using the
first argument as the message argument when constructing it. It will then log the error
including the full call stack for you to easily find where the error came from without
having to do the dirty work yourself. All you have to do is call one function with a
generic string as the argument. Easy peasy.

`catch` is similar to `error`, but will check if the first argument is already an error.
It will only generate a new `Error` itself if the first argument is not already an `Error`,
`TypeError`, or `ReferenceError`. If you the value you are dealing with may or may not be
an error, and you don't want to manually check yourself, then use this method.
```JavaScript
garden.error( 'something went wrong!!1!' )
garden.typeerror( 'you gave me the incorrect thing!' )
garden.referenceerror( 'you gave me nothing!' )
garden.catch( aThrownError )
```

### time and timeEnd
Each method takes a String, Symbol, or undefined as the first argument. `time` should
be called at the begin of what you would like to time with a name or `Symbol` representing
what you are timing, and `timeEnd` should be called once the task has been completed with
the same name. The time taken to complete the task will then be logged up to 1/1,000,000,000th
of a second.
```JavaScript
garden.time( name ) // Doesn't print anything
garden.timeEnd( name ) // Will print the time in between calling .time() and now

let tracker = Symbol()
garden.time( tracker )
garden.timeEnd( tracker )
```

### count
Takes a String, Symbol, or undefined as an argument, and then logs how many times `count`
has been called with that specific argument.
```JavaScript
let secret = Symbol()

garden.count() // 1
garden.count() // 2
garden.count( 'hello sailor' ) // 1
garden.count( 'hello sailor' ) // 2
garden.count( secret ) // 1
garden.count( secret ) // 2
```

### assert and assert_eq
Two assert functions are also provided for the sake of completeness. They both behave
as you would expect. Additional arguments can be passed to provide additional details
on what was expected, and possibly why the assert fails.
```JavaScript
garden.assert( true, 'Expected to be true' ) // Does nothing
garden.assert( false, 'Expected to be true' ) // Throws

garden.assert_eq( 1, 1, 'Expect 1 to equal 1', stateOfSomethingRelated ) // Does nothing
garden.assert_eq( 1, 2, 'Expect 1 to equal 2', stateOfSomethingRelated ) // Throws
```

### v3 vs v4
- options.scopeStyle now expects a CSS-style object, not a function
- catch, error, typeerror, and referenceerror no longer log unless verbose is set
in order to reduce duplicates if the error is also thrown
