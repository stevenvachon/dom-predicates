# dom-predicates [![NPM Version][npm-image]][npm-url] ![File Size][filesize-image] ![Build Status][ci-image] [![Coverage Status][coveralls-image]][coveralls-url]

> Functions for determining if an object resembles a DOM [`Node`](https://mdn.io/Node) of various types (from any `Realm`) via [duck typing](https://wikipedia.org/wiki/Duck_typing).

Note: [jsdom](https://npmjs.com/jsdom) nodes are *supported* and without having to define globals such as `window` and `document`.


## Installation

[Node.js](http://nodejs.org) `>= 10` is required. To install, type this at the command line:
```shell
npm install dom-predicates
```


## Importing

ES Module:
```js
import {isHTMLElementNode} from 'dom-predicates';
```

CommonJS Module:
```js
const {isHTMLElementNode} = require('dom-predicates');
```


## Functions

### `isAttachedNode(node)`
Determine if `node` exists within any DOM tree.

```js
const div = document.createElement('div');
isAttachedNode(div); //-> false

document.body.append(div);
isAttachedNode(div); //-> true
```

### `isCustomElementNode(node[, registry])`
Determine if `node` is a custom [`HTMLElement`](https://mdn.io/HTMLElement) defined within `registry` (a [`CustomElementRegistry`](https://mdn.io/CustomElementRegistry)). The value of `registry` will default to `window.customElements` (for the `Realm` where this library was imported) within a web browser.

```js
isCustomElementNode(document.createElement('my-component'), customElements); //-> true or false
isCustomElementNode(document.createElement('div'), customElements); //-> false
```

### `isCustomElementRegistry(registry)`
Determine if `registry` is a [`CustomElementRegistry`](https://mdn.io/CustomElementRegistry).

```js
isCustomElementRegistry(window.customElements); //-> true
```

### `isDocumentFragmentNode(node)`
Determine if `node` is a [`DocumentFragment`](https://mdn.io/DocumentFragment).

```js
isDocumentFragmentNode(document.createDocumentFragment()); //-> true
isDocumentFragmentNode(document); //-> false
```

### `isDocumentNode(node)`
Determine if `node` is a [`Document`](https://mdn.io/Document) (or subclass).

```js
isDocumentNode(document); //-> true
isDocumentNode(document.implementation.createDocument(null, 'xml')); //-> true
isDocumentNode(document.body); //-> false
```

### `isDocumentTypeNode(node)`
Determine if `node` is a [`DocumentType`](https://mdn.io/DocumentType).

```js
isDocumentTypeNode(document.doctype); //-> true or false
isDocumentTypeNode(document.implementation.createDocumentType('html', '', '')); //-> true
isDocumentTypeNode(document); //-> false
```

### `isElementNode(node)`
Determine if `node` is an [`Element`](https://mdn.io/Element) (or subclass).

```js
isElementNode(document.createElement('div')); //-> true
isElementNode(document.createElementNS('http://www.w3.org/2000/svg', 'path')); //-> true
isElementNode(document.createTextNode('content')); //-> false
```

### `isHTMLDocumentNode(node)`
Determine if `node` is an [`HTMLDocument`](https://mdn.io/HTMLDocument).

```js
isHTMLDocumentNode(document); //-> true or false
isHTMLDocumentNode(document.implementation.createHTMLDocument()); //-> true
isHTMLDocumentNode(document.implementation.createDocument(null, 'xml')); //-> false
isHTMLDocumentNode(document.body); //-> false
```

### `isHTMLElementNode(node[, tagName])`
Determine if `node` is an [`HTMLElement`](https://mdn.io/HTMLElement) (or subclass).

```js
isHTMLElementNode(document.createElement('div')); //-> true
isHTMLElementNode(document.createElementNS('http://www.w3.org/2000/svg', 'div')); //-> false
```
With the optional `tagName` argument:
```js
isHTMLElementNode(document.createElement('div'), 'div'); //-> true
isHTMLElementNode(document.createElement('div'), 'span'); //-> false
````

### `isKnownElementNode(node)`
Determine if `node` has a known tag name in relation to its type ([`HTMLElement`](https://mdn.io/HTMLElement) or [`SVGElement`](https://mdn.io/SVGElement)). This does not include [`CustomElementRegistry`](https://mdn.io/CustomElementRegistry).

```js
isKnownElementNode(document.createElement('div')); //-> true
isKnownElementNode(document.createElementNS('http://www.w3.org/2000/svg', 'path')); //-> true
isKnownElementNode(document.createElement('non-existent')); //-> false
```

### `isNode(node)`
Determine if `node` is a [`Node`](https://mdn.io/Node) (or subclass).

```js
isNode(document.createElement('div')); //-> true
isNode(document.createTextNode('content')); //-> true
```

### `isProcessingInstructionNode(node)`
Determine if `node` is a [`ProcessingInstruction`](https://mdn.io/ProcessingInstruction).

```js
isProcessingInstructionNode(document.createProcessingInstruction('xml', '')); //-> true
isProcessingInstructionNode(document); //-> false
```

### `isSelfClosingElementNode(node)`
Determine if `node` is a [void](https://www.w3.org/TR/html5/syntax.html#void-elements) [`HTMLElement`](https://mdn.io/HTMLElement) or a known self-closing [`SVGElement`](https://mdn.io/SVGElement).

```js
isSelfClosingElementNode(document.createElement('input')); //-> true
isSelfClosingElementNode(document.createElementNS('http://www.w3.org/2000/svg', 'input')); //-> false

isSelfClosingElementNode(document.createElementNS('http://www.w3.org/2000/svg', 'path')); //-> true
isSelfClosingElementNode(document.createElement('path')); //-> false
```

### `isSVGDocumentNode(node)`
Determine if `node` is an [`XMLDocument`](https://mdn.io/XMLDocument) with an SVG namespace.

```js
isSVGDocumentNode(document); //-> true or false
isSVGDocumentNode(document.implementation.createDocument('http://www.w3.org/2000/svg', 'svg')); //-> true

isSVGDocumentNode(document.implementation.createDocument(null, 'xml')); //-> false
isSVGDocumentNode(document.implementation.createHTMLDocument()); //-> false
isSVGDocumentNode(document.body); //-> false
```

### `isSVGElementNode(node[, tagName])`
Determine if `node` is an [`SVGElement`](https://mdn.io/SVGElement) (or subclass).

```js
isSVGElementNode(document.createElementNS('http://www.w3.org/2000/svg', 'path')); //-> true
isSVGElementNode(document.createElement('path')); //-> false
```
With the optional `tagName` argument:
```js
isSVGElementNode(document.createElementNS('http://www.w3.org/2000/svg', 'path'), 'path'); //-> true
isSVGElementNode(document.createElementNS('http://www.w3.org/2000/svg', 'path'), 'circle'); //-> false
````

### `isTextNode(node)`
Determine if `node` is a [`Text`](https://mdn.io/API/Text) (or subclass).

```js
isTextNode(document.createTextNode('')); //-> true
isTextNode(document.createCDATASection('')); //-> true
isTextNode(document.createElement('div')); //-> false
```

### `isVoidHTMLElementNode(node)`
Determine if `node` is a [void](https://www.w3.org/TR/html5/syntax.html#void-elements) [`HTMLElement`](https://mdn.io/HTMLElement).

```js
isVoidHTMLElementNode(document.createElement('input')); //-> true
isVoidHTMLElementNode(document.createElementNS('http://www.w3.org/2000/svg', 'input')); //-> false
isVoidHTMLElementNode(document.createElement('div')); //-> false
```

### `isXHTMLDocumentNode(node)`
Determine if `node` is an [`XMLDocument`](https://mdn.io/XMLDocument) with an XHTML namespace.

```js
isXHTMLDocumentNode(document); //-> true or false
isXHTMLDocumentNode(document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html')); //-> true
isXHTMLDocumentNode(document.implementation.createHTMLDocument()); //-> false
isXHTMLDocumentNode(document.body); //-> false
```

### `isXMLDocumentNode(node)`
Determine if `node` is an [`XMLDocument`](https://mdn.io/XMLDocument) (with any namespace).

```js
isXMLDocumentNode(document); //-> true or false
isXMLDocumentNode(document.implementation.createDocument(null, 'xml')); //-> true
isXMLDocumentNode(document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html')); //-> true
isXMLDocumentNode(document.implementation.createHTMLDocument()); //-> false
isXMLDocumentNode(document.body); //-> false
```


## Compatibility

Depending on your target browsers, you may need polyfills/shims for the following:

* [`globalThis`](https://mdn.io/globalThis)
* [`Set`](https://mdn.io/Set)
* [`String::endsWith`](https://mdn.io/String/endsWith)


## FAQ

1. **Why is there no `isXHTMLElementNode()`?**  
Because it's impossible to differentiate. All HTML elements (non-SVG, etc) within an XHTML document are still instances of `HTMLElement` and all HTML elements within HTML and XHTML documents (excluding HTML4 and below) have an XHTML namespace by default.

2. **Why are HTML4 and DOM3 features not supported?**  
Because they're deprecated and shouldn't be used.


[npm-image]: https://img.shields.io/npm/v/dom-predicates.svg
[npm-url]: https://npmjs.com/package/dom-predicates
[filesize-image]: https://img.shields.io/badge/size-2.2kB%20gzipped-blue.svg
[ci-image]: https://github.com/stevenvachon/dom-predicates/workflows/tests/badge.svg
[coveralls-image]: https://img.shields.io/coveralls/stevenvachon/dom-predicates.svg
[coveralls-url]: https://coveralls.io/github/stevenvachon/dom-predicates
