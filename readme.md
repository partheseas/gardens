# Gardens
Gardens make it easier to trace the flow of your code by automatically printing
the name of the space that you are logging from. For the most part a garden can
be used interchangably with `console`.

## Usage
```JavaScript
let gardens = require( 'gardens' )
// -or-
let Garden = require( 'gardens' )

let garden = gardens.createGarden( 'example', isVerbose )
// -or-
let garden2 = new Garden( '2nd example' )

// These are all for general logging
garden.log( 'message' )
garden.info( 'new message' )
garden.warn( 'uhh oh' )
garden.warning( 'also uhh oh' )

garden.isVerbose()
// These can be toggled and used for debugging
garden.debug( 'this might be interesting' )
graden.trace( 'if you are the package developer' )

// These are used for logging different error types
// They all return an instance of their respective errors
garden.error( 'something went wrong!!1!' )
garden.typeerror( 'you gave me the incorrect thing!' )
garden.referenceerror( 'you gave me nothing!' )
garden.catch( aThrownError )

// All 3 of the following examples time things.
garden.time( name ) // Doesn't print anything
garden.timeEnd( name ) // Will print the time in between calling .time() and now
// You can use Symbols as names
let tracker = Symbol()
garden.time( tracker )
garden.timeEnd( tracker )
// You can also use the Timer instance this returns
let timer = garden.time()
timer.end()

// Counters work with Strings and Symbols as well
garden.count() // 1
garden.count() // 2
garden.count( 'hello sailor' ) // 1
garden.count( 'hello sailor' ) // 2
garden.count( tracker ) // 1
garden.count( tracker ) // 2
```

### log, warn, and warning
These methods all just dump the arguments given out to the console like you would
expect. The output is prefixed with the name of the garden, and the type of output. (log or warning)

### debug and trace
The debug method is similar to `log`, but it will only print if `garden.verbose` or
`gardens.verbose` is set to true. If both of these are `undefined` or `null`ish then
the call will do nothing.

The story for trace is similar, though it behaves more like `catch` than `log`, meaning
that if it is verbose, it will print a call stack.

### error, typeerror and referenceerror
These methods will automagically create an Error, TypeError or ReferenceError using the
first argument as the message argument when constructing it. It will then log the error
including the full call stack for you to easily find where the error came from without
having to do the dirty work yourself. All you have to do is call one function with a
generic string as the argument. Easy peasy.

### catch
Similar to error, but it will check if the first argument is already an error. It will only
generate a new Error itself if the first argument is not already an Error, TypeError,
or ReferenceError. If you the value you are dealing with may or may not be an error, and
you don't want to manually check yourself, then use this method.

### time and timeEnd
Each method takes a String, Symbol, or undefined as the first argument. `time` should
be called at the begin of what you would like to time with a name or `Symbol` representing
what you are timing, and `timeEnd` should be called once the task has been completed with
the same name. The time taken to complete the task will then be logged up to 1/1,000,000,000th
of a second.

It should be noted that `time` also returns a Timer object, which has a method `.end`,
that can also be called to log the end time if you'd rather keep track of the timer itself
than the name/symbol.

### count
Takes a String, Symbol, or undefined as an argument, and then logs how many times `count`
has been called with that specific argument.
