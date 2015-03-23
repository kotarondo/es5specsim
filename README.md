An ECMAScript 5.1 Specification Simulator
=========================================

ES5specsim is a JavaScript interpreter written in JavaScript. It is implemented according to the "ECMAScript 5.1 Specification" without any optimization. So you can easily find one-to-one correspondences between the specification and the implementation.

Although ES5specsim can run in web browsers, there is no use in practice because the running program under ES5specsim cannot access the browser's host objects. What's worse, it runs several hundred times slower than in web browsers. Here are the reasons why ES5specsim is a "simulator".

You may run ES5specsim
- if you want to know pure conforming results
- for studying purpose
- just for fun

How to start ES5specsim
-----------------------
- Download source files and open "es5specsim.html" file in your browser,
- or visit http://kotarondo.github.io/es5specsim/es5specsim.html where they are already installed.

STRICT CONFORMANCE flag
-----------------------
As default, ES5specsim implements some extensions and modifications in order to pass the es5-tests of the tc39/test262 project. If you want ES5specsim to be strictly conforming to the specification normative only, you can turn on STRICT CONFORMANCE flag.

It *disables* following supports.
- Annex B in the specification
- function declaration as a statement
- regular expression extension
- Unicode 5.1 support (instead of Unicode 3.0)

Why not ES6?
------------
Actually, I'm working on ES6 specification now. Since it has pretty much pages (nearly 600 pages, in contrast ES5 has only 250 pages), it takes longer time to implement, and it needs more effort to support Generator Function. I think ES6specsim will be another project.
