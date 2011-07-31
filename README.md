RubyScript
==========

RubyScript is a YARV-to-JavaScript compiler which aims to be able to
run Ruby in the browser. Although at the moment we're mostly focused on
running it on Node.js.


Getting Started
---------------

You need:

* Ruby 1.9.2 -- Tested on `ruby 1.9.2p180`
* Node.js -- Tested on v0.4.9

Then run:

    $ cat test.rb
    p 123
    $ bin/rubyscript test.rb
    (The compiled JavaScript is printed and evaluated)
    123


Exploring
---------

### `lib/rubyscript/yarv/compiler.rb`

Uses `RubyVM::InstructionSequence` to compile Ruby to YARV bytecode to
JavaScript (which depends on the runtime files described below).

### `lib/rubyscript/base.js`

This defines the object-system of Ruby in JavaScript, including objects,
classes, modules, inheritence, singleton classes, mixins and simple
lookup.

### `lib/rubyscript/yarv/core.js`

Extends the base with (mostly) YARV specific, rather important,
methods. Some of these should probably be abstracted away to a
`lib/rubyscript/core.js` so there's *only* YARV-related methods here.

### `lib/rubyscript/yarv/node_core.js`

Extends the base with Node.js specific methods.

### `lib/rubyscript/yarv/runner.js`

Runs compiled YARV bytecode.

### `bin/rubyscript`

Hooks everything together

