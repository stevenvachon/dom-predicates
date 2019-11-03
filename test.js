"use strict";
const {after, afterEach, before, beforeEach, describe, it} = require("mocha");
const cartesianProduct = require("cartesian-product");
const {expect} = require("chai");
const
{
	isAttachedNode,
	isCustomElementNode,
	isCustomElementRegistry,
	isDocumentFragmentNode,
	isDocumentNode,
	isDocumentTypeNode,
	isElementNode,
	isHTMLDocumentNode,
	isHTMLElementNode,
	isKnownElementNode,
	isNode,
	isProcessingInstructionNode,
	isSelfClosingElementNode,
	isSVGDocumentNode,
	isSVGElementNode,
	isTextNode,
	isXHTMLDocumentNode,
	isXMLDocumentNode,
	isVoidHTMLElementNode
} = require("./");
const HTML_TAG_NAMES = require("html-tags");
const {JSDOM} = require("jsdom");
const puppeteer = require("puppeteer");
const puppeteerCoverage = require("puppeteer-to-istanbul");
const SVG_TAG_NAMES = require("svg-tag-names");
const {svgElements: SELF_CLOSING_SVG_TAG_NAMES, voidElements: VOID_HTML_TAG_NAMES} = require("self-closing-tags");
require("array.prototype.flat").shim();



let browser, page;

const AUTONOMOUS_CUSTOM_HTML_TAG_NAME = "non-existent";
const UNKNOWN_HTML_TAG_NAME = "nonexistent";

const NORMAL_HTML_TAG_NAMES = HTML_TAG_NAMES.filter(tagName => !VOID_HTML_TAG_NAMES.includes(tagName));
const NORMAL_SVG_TAG_NAMES = SVG_TAG_NAMES.filter(tagName => !SELF_CLOSING_SVG_TAG_NAMES.includes(tagName));
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";



// @todo use npmjs.com/assign-dom-doctype
const assignDoctype = (documentType, {document}) =>
{
	const originalDocumentType = document.doctype;

	if (documentType!==null && originalDocumentType!==null)
	{
		originalDocumentType.replaceWith(documentType);
	}
	else if (documentType!==null && originalDocumentType===null)
	{
		document.documentElement.before(documentType);
	}
	else if (documentType===null && originalDocumentType!==null)
	{
		originalDocumentType.remove();
	}

	return originalDocumentType;
};



const getAllAutonomousCustomElementNodes = realms =>
[
	...getAutonomousCustomHTMLElementNodes(realms),
	...getAutonomousCustomXHTMLElementNodes(realms)
];



const getAllDocumentNodes = (realms, includeCurrentDocuments=true) =>
[
	...(includeCurrentDocuments ? realms.map(({document}) => document) : []),
	...getHTMLDocumentNodes(realms),
	...getSVGDocumentNodes(realms),
	...getXHTMLDocumentNodes(realms),
	...getXMLDocumentNodes(realms)
];



const getAllElementNodes = realms =>
[
	...getAllAutonomousCustomElementNodes(realms),
	...getHTMLElementNodes(realms),
	...getHTMLUnknownElementNodes(realms),
	...getSVGElementNodes(realms),
	...getXHTMLElementNodes(realms),
	...getXMLElementNodes(realms)
];



const getAutonomousCustomHTMLElementNodes = realms => mapRealms(realms, ({document}) => document.createElement(AUTONOMOUS_CUSTOM_HTML_TAG_NAME));

const getAutonomousCustomXHTMLElementNodes = realms => mapRealms(realms, ({document}) => document.createElementNS(XHTML_NAMESPACE, AUTONOMOUS_CUSTOM_HTML_TAG_NAME));

const getCDATASectionNodes = realms => getXMLDocumentNodes(realms).map(document => document.createCDATASection("data"));

const getCommentNodes = realms => mapRealms(realms, ({document}) => document.createComment("data"));



// @todo https://github.com/w3c/webcomponents/issues/754
const getCustomElementNodes = (realms, tagNames=["custom-element"]) => mapRealms(realms, realm => tagNames.map(tagName =>
{
	try
	{
		realm.customElements.define(tagName, class CustomElement extends realm.HTMLElement{});
	}
	catch
	{
		// Already defined (or no `customElements` implementation, but that's avoided)
	}

	return realm.document.createElement(tagName);
})).flat();



const getDocumentFragmentNodes = realms => mapRealms(realms, ({document}) => document.createDocumentFragment());

const getDocumentTypeNodes = realms => mapRealms(realms, ({document}) => document.implementation.createDocumentType("qualifiedNameStr", "publicId", "systemId"));

const getHTMLDocumentNodes = realms => mapRealms(realms, ({document}) => document.implementation.createHTMLDocument("title"));

const getHTMLElementNodes = (realms, tagNames=HTML_TAG_NAMES) => mapRealms(realms, ({document}) => tagNames.map(tagName => document.createElement(tagName))).flat();

const getHTMLUnknownElementNodes = realms => mapRealms(realms, ({document}) => document.createElement(UNKNOWN_HTML_TAG_NAME));



const getPrimitives = (config={}) =>
{
	const result = [];

	if (config.array !== false)
	{
		result.push([]);
	}

	if (config.bigint !== false)
	{
		result.push(1n);
	}

	if (config.booleans !== false)
	{
		result.push(false, true);
	}

	if (config.NaN !== false)
	{
		result.push(NaN);
	}

	if (config.null !== false)
	{
		result.push(null);
	}

	if (config.numbers !== false)
	{
		result.push(0, new Number(0), 1, new Number(1), Infinity, -Infinity);
	}

	if (config.object !== false)
	{
		result.push({});
	}

	if (config.regex !== false)
	{
		result.push(/regex/);
	}

	if (config.strings !== false)
	{
		result.push("string", new String("string"));
	}

	if (config.symbol !== false)
	{
		result.push(Symbol());
	}

	if (config.undefined !== false)
	{
		result.push(undefined);
	}

	return result;
};



const getProcessingInstructionNodes = realms => mapRealms(realms, ({document}) => document.createProcessingInstruction("target", "data"));

const getSVGDocumentNodes = realms => mapRealms(realms, ({document}) => document.implementation.createDocument(SVG_NAMESPACE, "svg"));

const getSVGElementNodes = (realms, tagNames=SVG_TAG_NAMES) => mapRealms(realms, ({document}) => tagNames.map(tagName => document.createElementNS(SVG_NAMESPACE, tagName))).flat();

const getTextNodes = realms => mapRealms(realms, ({document}) => document.createTextNode("data"));

const getXHTMLDocumentNodes = realms => mapRealms(realms, ({document}) => document.implementation.createDocument(XHTML_NAMESPACE, "html"));

const getXHTMLElementNodes = (realms, tagNames=HTML_TAG_NAMES) => mapRealms(realms, ({document}) => tagNames.map(tagName => document.createElementNS(XHTML_NAMESPACE, tagName))).flat();

const getXMLDocumentNodes = realms => mapRealms(realms, ({document}) => document.implementation.createDocument(null, "root-node-name"));

const getXMLElementNodes = (realms, tagNames=["tagName"]) => mapRealms(realms, ({document}) => tagNames.map(tagName => document.createElementNS(null, tagName))).flat();

const mapRealms = (realms, callback) => (Array.isArray(realms) ? realms : [realms]).map(callback);



const runInBoth = (...args) => () => Promise.all(
[
	runInBrowser(...args)(),
	runInNodeJS(...args)()
]);



const runInBrowser = func => async () =>
{
	const realms = await page.evaluateHandle(() =>
	[
		window,
		...Array.from(document.querySelectorAll("iframe")).map(({contentWindow}) => contentWindow)
	]);

	return page.evaluate(func, realms);
};



const runInNodeJS = func => () =>
{
	const {window} = new JSDOM("<!doctype html>");
	const {document} = window;

	const iframe = document.createElement("iframe");
	document.body.append(iframe);

	func([window, iframe.contentWindow]);
};



// @todo also use npmjs.com/puppeteer-firefox
before(async () =>
{
	browser = await puppeteer.launch({ args: ["--no-sandbox"] });
	page = await browser.newPage();

	page.on("console", async msg => console[msg._type](...await Promise.all(msg.args().map(arg => arg.jsonValue()))));
	page.on("pageerror", console.error);

	await Promise.all(
	[
		page.addScriptTag({ path: "node_modules/chai/chai.js" }),
		page.addScriptTag({ path: "temp.js" }),

		// @todo https://github.com/GoogleChrome/puppeteer/issues/5108
		// @todo https://github.com/GoogleChrome/puppeteer/issues/5166
		page.addScriptTag(
		{
			content: Object.entries(
				{
					assignDoctype,
					AUTONOMOUS_CUSTOM_HTML_TAG_NAME,
					cartesianProduct,
					getAllAutonomousCustomElementNodes,
					getAllDocumentNodes,
					getAllElementNodes,
					getAutonomousCustomHTMLElementNodes,
					getAutonomousCustomXHTMLElementNodes,
					getCDATASectionNodes,
					getCommentNodes,
					getCustomElementNodes,
					getDocumentFragmentNodes,
					getDocumentTypeNodes,
					getHTMLDocumentNodes,
					getHTMLElementNodes,
					getHTMLUnknownElementNodes,
					getPrimitives,
					getProcessingInstructionNodes,
					getSVGDocumentNodes,
					getSVGElementNodes,
					getTextNodes,
					getXHTMLDocumentNodes,
					getXHTMLElementNodes,
					getXMLDocumentNodes,
					getXMLElementNodes,
					HTML_TAG_NAMES,
					mapRealms,
					NORMAL_HTML_TAG_NAMES,
					NORMAL_SVG_TAG_NAMES,
					SELF_CLOSING_SVG_TAG_NAMES,
					SVG_NAMESPACE,
					SVG_TAG_NAMES,
					UNKNOWN_HTML_TAG_NAME,
					VOID_HTML_TAG_NAMES,
					XHTML_NAMESPACE
				})
				.map(([name, value]) => `window.${name} = ${typeof value === "function" ? value.toString() : JSON.stringify(value)}`)
				.join(";\n")
				.concat("//UGH")
		}),

		// @todo https://github.com/istanbuljs/puppeteer-to-istanbul/issues/18
		// @todo https://github.com/GoogleChrome/puppeteer/issues/3570
		page.coverage.startJSCoverage({ reportAnonymousScripts: true })
	]);

	await page.evaluate(() =>
	{
		window.expect = chai.expect;
		delete window.chai;  // cleanup

		if (DOMPredicates)
		{
			Object.entries(DOMPredicates).forEach(([key, value]) => window[key] = value);
		}
	});
});



beforeEach(runInBrowser(() => document.body.append(document.createElement("iframe"))));

afterEach(runInBrowser(() => document.querySelectorAll("iframe").forEach(iframe => iframe.remove())));



after(async () =>
{
	let coverage = await page.coverage.stopJSCoverage();

	coverage = coverage
		.filter(({url}) => !url.includes("chai"))  // exclude test dependency
		.filter(({text}) => !text.includes("//UGH"));  // exclude helpers

	puppeteerCoverage.write(coverage);

	await browser.close();
});



describe("Bundle", () =>
{
	it("is a global object", runInBrowser(() =>
	{
		expect(DOMPredicates).to.be.an("object");
	}));
});



describe("isAttachedNode()", () =>
{
	it("is a function", runInBoth(() => expect(isAttachedNode).to.be.a("function")));



	it("returns true/false for a cross-Realm Node", runInBoth(realms =>
	{
		const nodes =
		[
			...getAllElementNodes(realms),
			...getCommentNodes(realms),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms)
		];

		cartesianProduct([realms, nodes])
			.map(([{document: {body: target}}, node]) => ({node, target}))
			.forEach(({node, target}) =>
			{
				expect(isAttachedNode(node)).to.be.false;

				target.append(node);

				expect(isAttachedNode(node)).to.be.true;

				node.remove();
			});
	}));



	it("returns true/false for a DocumentType", runInBoth(realms => realms.forEach(realm =>
	{
		getDocumentTypeNodes(realm).forEach(fixture =>
		{
			expect(isAttachedNode(fixture)).to.be.false;

			const originalDocumentType = assignDoctype(fixture, realm);

			expect(isAttachedNode(fixture)).to.be.true;

			assignDoctype(originalDocumentType, realm);
		});
	})));



	it("returns true for a default Document", runInBoth(realms => realms.forEach(({document}) =>
	{
		expect(isAttachedNode(document)).to.be.true;
	})));



	it("returns false for a created Document", runInBoth(realms =>
	{
		getAllDocumentNodes(realms, false).forEach(fixture => expect(isAttachedNode(fixture)).to.be.false);
	}));



	it("returns false for a DocumentFragment", runInBoth(realms =>
	{
		getDocumentFragmentNodes(realms).forEach(fixture => expect(isAttachedNode(fixture)).to.be.false);
	}));



	it("returns false for a CDATASection", runInBrowser(realms =>
	{
		getCDATASectionNodes(realms).forEach(fixture => expect(isAttachedNode(fixture)).to.be.false);
	}));



	it("returns false for a non-Node", runInBoth(realms =>
	{
		const fixtures =
		[
			...getPrimitives(),
			...realms
		];

		fixtures.forEach(fixture => expect(isAttachedNode(fixture)).to.be.false);
	}));



	it("returns false for globalThis", runInBoth(realms => realms.forEach(realm =>
	{
		expect(isAttachedNode(realm)).to.be.false;
	})));



	it("supports Nodes inside a DocumentFragment", runInBoth(realms => realms.forEach(({document}) =>
	{
		const fragment = document.createDocumentFragment();
		const parent = document.createElement("div");
		const target = document.createTextNode("data");

		expect(isAttachedNode(target)).to.be.false;

		parent.append(target);
		fragment.append(parent);

		expect(isAttachedNode(target)).to.be.false;

		document.body.append(fragment);

		expect(isAttachedNode(target)).to.be.true;

		parent.remove();
	})));



	it("supports Nodes inside <body>", runInBoth(realms => realms.forEach(({document}) =>
	{
		const parent = document.createElement("div");
		const target = document.createTextNode("data");

		expect(isAttachedNode(target)).to.be.false;

		parent.append(target);
		document.body.append(parent);

		expect(isAttachedNode(target)).to.be.true;

		parent.remove();
	})));



	it("supports Nodes outside <body>", runInBoth(realms => realms.forEach(({document}) =>
	{
		const parent = document.createElement("div");
		const target = document.createTextNode("data");

		expect(isAttachedNode(target)).to.be.false;

		parent.append(target);
		document.head.append(parent);

		expect(isAttachedNode(target)).to.be.true;

		parent.remove();
	})));
});



describe("isCustomElementNode()", () =>
{
	it("is a function", runInBoth(() => expect(isCustomElementNode).to.be.a("function")));



	// @todo https://github.com/jsdom/jsdom/issues/1030
	it("returns true for a custom HTMLElement from the same Realm as its CustomElementRegistry", runInBrowser(realms => realms.forEach(realm =>
	{
		getCustomElementNodes(realm).forEach(element =>
		{
			expect(isCustomElementNode(element, realm.customElements)).to.be.true;
		});
	})));



	// @todo https://github.com/jsdom/jsdom/issues/1030
	it("returns false for a custom HTMLElement from a different Realm than its CustomElementRegistry", runInBrowser(realms =>
	{
		realms
			.map(realmA => realms
				.filter(realmB => realmB !== realmA)
				.map(realmB =>
				({
					elements: getCustomElementNodes(realmB),
					registry: realmA.customElements
				}))
			)
			.flat()
			.forEach(({element, registry}) =>
			{
				expect(isCustomElementNode(element, registry)).to.be.false;
			});
	}));



	// @todo https://github.com/jsdom/jsdom/issues/1030
	it("returns false for a non-custom HTMLElement from any Realm", runInBrowser(realms =>
	{
		const elements =
		[
			...getAllDocumentNodes(realms),
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms),
			...realms
		];

		const registries = realms.map(({customElements}) => customElements);

		cartesianProduct([elements, registries]).forEach(([element, registry]) =>
		{
			expect(isCustomElementNode(element, registry)).to.be.false;
		});
	}));



	// @todo https://github.com/jsdom/jsdom/issues/1030
	it("returns false for a non-CustomElementRegistry from any Realm", runInBrowser(realms =>
	{
		const elements = getCustomElementNodes(realms);

		// Avoid default registry value
		const primitives = getPrimitives({ undefined: false });

		const registries =
		[
			...getAllDocumentNodes(realms),
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms),
			...primitives,
			...realms
		];

		cartesianProduct([elements, registries]).forEach(([element, registry]) =>
		{
			expect(isCustomElementNode(element, registry)).to.be.false;
		});
	}));



	// @todo https://github.com/jsdom/jsdom/issues/1030
	it("supports an undefined CustomElementRegistry", runInBrowser(([defaultRealm]) =>
	{
		getCustomElementNodes(defaultRealm).forEach(element => expect(isCustomElementNode(element)).to.be.true);
	}));
});



describe("isCustomElementRegistry()", () =>
{
	it("is a function", runInBoth(() => expect(isCustomElementRegistry).to.be.a("function")));



	// @todo https://github.com/jsdom/jsdom/issues/1030
	it("returns true for a CustomElementRegistry from any Realm", runInBrowser(realms => realms.forEach(realm =>
	{
		expect(isCustomElementRegistry(realm.customElements)).to.be.true;
	})));



	it("returns false for a non-CustomElementRegistry from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllDocumentNodes(realms),
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isCustomElementRegistry(fixture)).to.be.false);
	}));
});



describe("isDocumentFragmentNode()", () =>
{
	it("is a function", runInBoth(() => expect(isDocumentFragmentNode).to.be.a("function")));



	it("returns true for a DocumentFragment from any Realm", runInBoth(realms =>
	{
		getDocumentFragmentNodes(realms).forEach(fixture => expect(isDocumentFragmentNode(fixture)).to.be.true);
	}));



	it("returns false for a non-DocumentFragment from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllDocumentNodes(realms),
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isDocumentFragmentNode(fixture)).to.be.false);
	}));
});



describe("isDocumentNode()", () =>
{
	it("is a function", runInBoth(() => expect(isDocumentNode).to.be.a("function")));



	it("returns true for a Document from any Realm", runInBoth(realms =>
	{
		getAllDocumentNodes(realms).forEach(fixture => expect(isDocumentNode(fixture)).to.be.true);
	}));



	it("returns false for a non-Document from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isDocumentNode(fixture)).to.be.false);
	}));
});



describe("isDocumentTypeNode()", () =>
{
	it("is a function", runInBoth(() => expect(isDocumentTypeNode).to.be.a("function")));



	it("returns true for a DocumentType from any Realm", runInBoth(realms =>
	{
		getDocumentTypeNodes(realms).forEach(fixture => expect(isDocumentTypeNode(fixture)).to.be.true);
	}));



	it("returns false for a non-DocumentType from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllDocumentNodes(realms),
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isDocumentTypeNode(fixture)).to.be.false);
	}));
});



describe("isElementNode()", () =>
{
	it("is a function", runInBoth(() => expect(isElementNode).to.be.a("function")));



	it("returns true for an Element from any Realm", runInBoth(realms =>
	{
		getAllElementNodes(realms).forEach(fixture => expect(isElementNode(fixture)).to.be.true);
	}));



	it("returns false for a non-Element from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllDocumentNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isElementNode(fixture)).to.be.false);
	}));
});



describe("isHTMLDocumentNode()", () =>
{
	it("is a function", runInBoth(() => expect(isHTMLDocumentNode).to.be.a("function")));



	// @todo issue with jsdom
	it("returns true for a HTMLDocument from any Realm", runInBrowser(realms =>
	{
		getHTMLDocumentNodes(realms).forEach(fixture => expect(isHTMLDocumentNode(fixture)).to.be.true);
	}));



	it("returns false for a non-HTMLDocument from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getSVGDocumentNodes(realms),
			...getTextNodes(realms),
			...getXHTMLDocumentNodes(realms),
			...getXMLDocumentNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isHTMLDocumentNode(fixture)).to.be.false);
	}));
});



describe("isHTMLElementNode()", () =>
{
	it("is a function", runInBoth(() => expect(isHTMLElementNode).to.be.a("function")));



	it("returns true for an HTMLElement from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllAutonomousCustomElementNodes(realms),
			...getHTMLElementNodes(realms),
			...getHTMLUnknownElementNodes(realms),
			...getXHTMLElementNodes(realms)
		];

		fixtures.forEach(fixture => expect(isHTMLElementNode(fixture)).to.be.true);
	}));



	it("returns false for a non-HTMLElement from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllDocumentNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getSVGElementNodes(realms),
			...getTextNodes(realms),
			...getXMLElementNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isHTMLElementNode(fixture)).to.be.false);
	}));



	it("supports an optional tagName argument", runInBoth(realms =>
	{
		getHTMLElementNodes(realms, ["div"]).forEach(div =>
		{
			expect(isHTMLElementNode(div, "div")).to.be.true;
			expect(isHTMLElementNode(div, "span")).to.be.false;

			// Avoid default value and no need to test strings again
			getPrimitives({ strings:false, undefined:false }).forEach(primitive =>
			{
				expect(isHTMLElementNode(div, primitive)).to.be.false;
			});
		});
	}));
});



describe("isKnownElementNode()", () =>
{
	it("is a function", runInBoth(() => expect(isKnownElementNode).to.be.a("function")));



	it("returns true for a known Element from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getHTMLElementNodes(realms),
			...getSVGElementNodes(realms),
			...getXHTMLElementNodes(realms)
		];

		fixtures.forEach(fixture => expect(isKnownElementNode(fixture)).to.be.true);
	}));



	it("returns false for an unknown Element from any Realm", runInBoth(realms =>
	{
		const UNKNOWN_TAG_NAMES =
		[
			AUTONOMOUS_CUSTOM_HTML_TAG_NAME,
			UNKNOWN_HTML_TAG_NAME
		];

		const fixtures =
		[
			...getAllAutonomousCustomElementNodes(realms),
			...getAllDocumentNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getHTMLUnknownElementNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getSVGElementNodes(realms, UNKNOWN_TAG_NAMES),
			...getTextNodes(realms),
			...getXMLElementNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isKnownElementNode(fixture)).to.be.false);
	}));
});



describe("isNode()", () =>
{
	it("is a function", runInBoth(() => expect(isNode).to.be.a("function")));



	it("returns true for a Node from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllDocumentNodes(realms),
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms)
		];

		fixtures.forEach(fixture => expect(isNode(fixture)).to.be.true);
	}));



	it("returns false for a non-Node from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getPrimitives(),
			...realms
		];

		fixtures.forEach(fixture => expect(isNode(fixture)).to.be.false);
	}));
});



describe("isProcessingInstructionNode()", () =>
{
	it("is a function", runInBoth(() => expect(isProcessingInstructionNode).to.be.a("function")));



	it("returns true for a ProcessingInstruction from any Realm", runInBoth(realms =>
	{
		getProcessingInstructionNodes(realms).forEach(fixture => expect(isProcessingInstructionNode(fixture)).to.be.true);
	}));



	it("returns false for a non-ProcessingInstruction from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllDocumentNodes(realms),
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getPrimitives(),
			...getTextNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isProcessingInstructionNode(fixture)).to.be.false);
	}));
});



describe("isSelfClosingElementNode()", () =>
{
	it("is a function", runInBoth(() => expect(isSelfClosingElementNode).to.be.a("function")));



	it("returns true for a self-closing Element from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getHTMLElementNodes(realms, VOID_HTML_TAG_NAMES),
			...getSVGElementNodes(realms, SELF_CLOSING_SVG_TAG_NAMES),
			...getXHTMLElementNodes(realms, VOID_HTML_TAG_NAMES)
		];

		fixtures.forEach(fixture => expect(isSelfClosingElementNode(fixture)).to.be.true);
	}));



	it("returns false for a self-closing Element of incorrect type from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getHTMLElementNodes(realms, SELF_CLOSING_SVG_TAG_NAMES),
			...getSVGElementNodes(realms, VOID_HTML_TAG_NAMES),
			...getXMLElementNodes(realms, SELF_CLOSING_SVG_TAG_NAMES),
			...getXMLElementNodes(realms, VOID_HTML_TAG_NAMES)
		];

		fixtures.forEach(fixture => expect(isSelfClosingElementNode(fixture)).to.be.false);
	}));



	it("returns false for a non-self-closing Element from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllAutonomousCustomElementNodes(realms),
			...getHTMLElementNodes(realms, NORMAL_HTML_TAG_NAMES),
			...getHTMLUnknownElementNodes(realms),
			...getXHTMLElementNodes(realms, NORMAL_HTML_TAG_NAMES)
		];

		fixtures.forEach(fixture => expect(isSelfClosingElementNode(fixture)).to.be.false);
	}));



	it("returns false for a non-Element from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllDocumentNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isSelfClosingElementNode(fixture)).to.be.false);
	}));
});



describe("isSVGDocumentNode()", () =>
{
	it("is a function", runInBoth(() => expect(isSVGDocumentNode).to.be.a("function")));



	// @todo issue with jsdom
	it("returns true for an SVG XMLDocument from any Realm", runInBrowser(realms =>
	{
		getSVGDocumentNodes(realms).forEach(fixture => expect(isSVGDocumentNode(fixture)).to.be.true);
	}));



	it("returns false for a non-SVG XMLDocument from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getHTMLDocumentNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms),
			...getXHTMLDocumentNodes(realms),
			...getXMLDocumentNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isSVGDocumentNode(fixture)).to.be.false);
	}));
});



describe("isSVGElementNode()", () =>
{
	it("is a function", runInBoth(() => expect(isSVGElementNode).to.be.a("function")));



	it("returns true for an SVGElement from any Realm", runInBoth(realms =>
	{
		getSVGElementNodes(realms).forEach(fixture => expect(isSVGElementNode(fixture)).to.be.true);
	}));



	it("returns false for a non-SVGElement from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllAutonomousCustomElementNodes(realms),
			...getAllDocumentNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getHTMLElementNodes(realms),
			...getHTMLUnknownElementNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms),
			...getXHTMLElementNodes(realms),
			...getXMLElementNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isSVGElementNode(fixture)).to.be.false);
	}));
});



describe("isTextNode()", () =>
{
	it("is a function", runInBoth(() => expect(isTextNode).to.be.a("function")));



	it("returns true for a Text from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getCDATASectionNodes(realms),
			...getTextNodes(realms)
		];

		fixtures.forEach(fixture => expect(isTextNode(fixture)).to.be.true);
	}));



	it("returns false for a non-Text from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllDocumentNodes(realms),
			...getAllElementNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isTextNode(fixture)).to.be.false);
	}));
});



describe("isVoidHTMLElementNode()", () =>
{
	it("is a function", runInBoth(() => expect(isVoidHTMLElementNode).to.be.a("function")));



	it("returns true for a void HTMLElement from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getHTMLElementNodes(realms, VOID_HTML_TAG_NAMES),
			...getXHTMLElementNodes(realms, VOID_HTML_TAG_NAMES)
		];

		fixtures.forEach(fixture => expect(isVoidHTMLElementNode(fixture)).to.be.true);
	}));



	it("returns false for a void non-HTMLElement from any Realm", runInBoth(realms =>
	{
		getXMLElementNodes(realms, VOID_HTML_TAG_NAMES).forEach(fixture =>
		{
			expect(isVoidHTMLElementNode(fixture)).to.be.false;
		});
	}));



	it("returns false for a non-void HTMLElement from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getHTMLElementNodes(realms, NORMAL_HTML_TAG_NAMES),
			...getXHTMLElementNodes(realms, NORMAL_HTML_TAG_NAMES)
		];

		fixtures.forEach(fixture => expect(isVoidHTMLElementNode(fixture)).to.be.false);
	}));



	it("returns false for a non-HTMLElement from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllDocumentNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getSVGElementNodes(realms),
			...getTextNodes(realms),
			...getXMLElementNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isVoidHTMLElementNode(fixture)).to.be.false);
	}));
});



describe("isXHTMLDocumentNode()", () =>
{
	it("is a function", runInBoth(() => expect(isXHTMLDocumentNode).to.be.a("function")));



	// @todo issue with jsdom
	it("returns true for an XHTML XMLDocument from any Realm", runInBrowser(realms =>
	{
		getXHTMLDocumentNodes(realms).forEach(fixture => expect(isXHTMLDocumentNode(fixture)).to.be.true);
	}));



	it("returns false for a non-XHTML XMLDocument from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getHTMLDocumentNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getSVGDocumentNodes(realms),
			...getTextNodes(realms),
			...getXMLDocumentNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isXHTMLDocumentNode(fixture)).to.be.false);
	}));
});



describe("isXMLDocumentNode()", () =>
{
	it("is a function", runInBoth(() => expect(isXMLDocumentNode).to.be.a("function")));



	// @todo issue with jsdom
	it("returns true for an XMLDocument from any Realm", runInBrowser(realms =>
	{
		const fixtures =
		[
			...getSVGDocumentNodes(realms),
			...getXHTMLDocumentNodes(realms),
			...getXMLDocumentNodes(realms)
		];

		fixtures.forEach(fixture => expect(isXMLDocumentNode(fixture)).to.be.true);
	}));



	it("returns false for a non-XMLDocument from any Realm", runInBoth(realms =>
	{
		const fixtures =
		[
			...getAllElementNodes(realms),
			...getCDATASectionNodes(realms),
			...getCommentNodes(realms),
			...getDocumentFragmentNodes(realms),
			...getDocumentTypeNodes(realms),
			...getHTMLDocumentNodes(realms),
			...getPrimitives(),
			...getProcessingInstructionNodes(realms),
			...getTextNodes(realms),
			...realms
		];

		fixtures.forEach(fixture => expect(isXMLDocumentNode(fixture)).to.be.false);
	}));
});
