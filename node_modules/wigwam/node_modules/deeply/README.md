# Deeply [![Build Status](https://travis-ci.org/alexindigo/deeply.png?branch=master)](https://travis-ci.org/alexindigo/deeply) [![Dependency Status](https://gemnasium.com/alexindigo/deeply.png)](https://gemnasium.com/alexindigo/deeply)

Javascript (Node + Browser) library that deeply merges properties of the provided objects, returns untangled copy (clone).

## Install

### Node
```
$ npm install deeply
```

### Ender
```
$ ender add deeply --use=your_ender_file
```

## Usage

### merge
– Deeply merges two or more objects.

Node:
``` javascript
var merge = require('deeply');

merge({a: {a1: 1}}, {a: {a2: 2}}); // -> {a: {a1: 1, a2: 2}}
```

Ender:
``` javascript
$.merge({a: {a1: 1}}, {a: {a2: 2}}); // -> {a: {a1: 1, a2: 2}}
```

### clone
– As degenerated case of merging one object on itself, it's possible to use deeply as deep clone function.

Node:
``` javascript
var merge = require('deeply')
  , clone = merge
  ;

var x = {a: {b: {c: 1}}};
var y = clone(x);

y.a.b.c = 2;

console.log(x.a.b.c); // -> 1
```

Ender:
``` javascript
var clone = $.merge;
var x = {a: {b: {c: 1}}};
var y = clone(x);

y.a.b.c = 2;

console.log(x.a.b.c); // -> 1
```

### Arrays custom merging
– By default array treated as primitive values and being replaced upon conflict, for more meaningful array merge strategy, provide custom reduce function as last argument.

Node:
``` javascript
var merge = require('deeply');

// default behavior

merge({ a: { b: [0, 2, 4] }}, { a: {b: [1, 3, 5] }}); // -> { a: { b: [1, 3, 5] }}

// custom merge function

function customMerge(a, b)
{
  return (a||[]).concat(b);
}

merge({ a: { b: [0, 2, 4] }}, { a: {b: [1, 3, 5] }}, customMerge); // -> { a: { b: [0, 2, 4, 1, 3, 5] }}
```

Ender:
``` javascript

// default behavior

$.merge({ a: { b: [0, 2, 4] }}, { a: {b: [1, 3, 5] }}); // -> { a: { b: [1, 3, 5] }}

// custom merge function

function customMerge(a, b)
{
  return (a||[]).concat(b);
}

$.merge({ a: { b: [0, 2, 4] }}, { a: {b: [1, 3, 5] }}, customMerge); // -> { a: { b: [0, 2, 4, 1, 3, 5] }}

```

More examples can be found in ```test/index.js```.

## License

Deeply is licensed under the MIT license.
