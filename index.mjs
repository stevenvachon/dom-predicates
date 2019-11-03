import HTML_TAG_NAMES_ORIGINAL from "html-tags";
import protochain from "protochain";
import SVG_TAG_NAMES_ORIGINAL from "svg-tag-names";
import {svgElements as SELF_CLOSING_SVG_TAG_NAMES_ORIGINAL, voidElements as VOID_HTML_TAG_NAMES_ORIGINAL} from "self-closing-tags";

const HTML_TAG_NAMES = new Set(HTML_TAG_NAMES_ORIGINAL);
const SELF_CLOSING_SVG_TAG_NAMES = new Set(SELF_CLOSING_SVG_TAG_NAMES_ORIGINAL);
const SVG_TAG_NAMES = new Set(SVG_TAG_NAMES_ORIGINAL);
const VOID_HTML_TAG_NAMES = new Set(VOID_HTML_TAG_NAMES_ORIGINAL);

// Base classes
const OBJECT_PROTOTYPE_CHAIN = "Object";
const EVENT_TARGET_PROTOTYPE_CHAIN = `EventTarget,${OBJECT_PROTOTYPE_CHAIN}`;
const NODE_PROTOTYPE_CHAIN = `Node,${EVENT_TARGET_PROTOTYPE_CHAIN}`;
const CHARACTER_DATA_PROTOTYPE_CHAIN = `CharacterData,${NODE_PROTOTYPE_CHAIN}`;

// Document node classes
const DOCUMENT_PROTOTYPE_CHAIN = `Document,${NODE_PROTOTYPE_CHAIN}`;
const HTML_DOCUMENT_PROTOTYPE_CHAIN = `HTMLDocument,${DOCUMENT_PROTOTYPE_CHAIN}`;
const XML_DOCUMENT_PROTOTYPE_CHAIN = `XMLDocument,${DOCUMENT_PROTOTYPE_CHAIN}`;

// Element node classes
const ELEMENT_PROTOTYPE_CHAIN = `Element,${NODE_PROTOTYPE_CHAIN}`;
const HTML_ELEMENT_PROTOTYPE_CHAIN = `HTMLElement,${ELEMENT_PROTOTYPE_CHAIN}`;
const SVG_ELEMENT_PROTOTYPE_CHAIN = `SVGElement,${ELEMENT_PROTOTYPE_CHAIN}`;

// Text-like node classes
const TEXT_PROTOTYPE_CHAIN = `Text,${CHARACTER_DATA_PROTOTYPE_CHAIN}`;
const CDATA_SECTION_PROTOTYPE_CHAIN = `CDATASection,${TEXT_PROTOTYPE_CHAIN}`;
const COMMENT_PROTOTYPE_CHAIN = `Comment,${CHARACTER_DATA_PROTOTYPE_CHAIN}`;

// Other classes
const CUSTOM_ELEMENT_REGISTRY_PROTOTYPE_CHAIN = `CustomElementRegistry,${OBJECT_PROTOTYPE_CHAIN}`;
const DOCUMENT_FRAGMENT_PROTOTYPE_CHAIN = `DocumentFragment,${NODE_PROTOTYPE_CHAIN}`;
const DOCUMENT_TYPE_PROTOTYPE_CHAIN = `DocumentType,${NODE_PROTOTYPE_CHAIN}`;
const PROCESSING_INSTRUCTION_PROTOTYPE_CHAIN = `ProcessingInstruction,${CHARACTER_DATA_PROTOTYPE_CHAIN}`;

// Namespaces
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";



const getPrototypeNameChain = object => protochain(object).map(({constructor: {name}}) => name).join(",");



export const isAttachedNode = node =>
{
	if (isDocumentNode(node))
	{
		return node.defaultView !== null;
	}
	else if (isNode(node))
	{
		return node.parentNode===node.ownerDocument || node.ownerDocument.documentElement.contains(node);
	}
	else
	{
		return false;
	}
};



// Can't rely on `node.defaultView.customElements` if node is detached
export const isCustomElementNode = (node, registry=globalThis?.customElements) =>
{
	if (isHTMLElementNode(node) && isCustomElementRegistry(registry))
	{
		return registry.get(node.tagName.toLowerCase()) === node.constructor;
	}
	else
	{
		return false;
	}
};



export const isCustomElementRegistry = registry => getPrototypeNameChain(registry).endsWith(CUSTOM_ELEMENT_REGISTRY_PROTOTYPE_CHAIN);

export const isDocumentFragmentNode = node => getPrototypeNameChain(node).endsWith(DOCUMENT_FRAGMENT_PROTOTYPE_CHAIN);

export const isDocumentNode = node => getPrototypeNameChain(node).endsWith(DOCUMENT_PROTOTYPE_CHAIN);

export const isDocumentTypeNode = node => getPrototypeNameChain(node).endsWith(DOCUMENT_TYPE_PROTOTYPE_CHAIN);

export const isElementNode = node => getPrototypeNameChain(node).endsWith(ELEMENT_PROTOTYPE_CHAIN);

export const isHTMLDocumentNode = node => getPrototypeNameChain(node).endsWith(HTML_DOCUMENT_PROTOTYPE_CHAIN);



export const isHTMLElementNode = (node, tagName) =>
{
	if (getPrototypeNameChain(node).endsWith(HTML_ELEMENT_PROTOTYPE_CHAIN))
	{
		return tagName===undefined || node.tagName.toLowerCase()===tagName;
	}
	else
	{
		return false;
	}
};



export const isKnownElementNode = node =>
{
	if (isHTMLElementNode(node))
	{
		return HTML_TAG_NAMES.has(node.tagName.toLowerCase());
	}
	else if (isSVGElementNode(node))
	{
		return SVG_TAG_NAMES.has(node.tagName)
	}
	else
	{
		return false;
	}
};



export const isNode = node => getPrototypeNameChain(node).endsWith(NODE_PROTOTYPE_CHAIN);

export const isProcessingInstructionNode = node => getPrototypeNameChain(node).endsWith(PROCESSING_INSTRUCTION_PROTOTYPE_CHAIN);



export const isSelfClosingElementNode = node =>
{
	if (isSVGElementNode(node))
	{
		return SELF_CLOSING_SVG_TAG_NAMES.has(node.tagName);
	}
	else
	{
		return isVoidHTMLElementNode(node);
	}
};



export const isSVGDocumentNode = node => isXMLDocumentNode(node) && node.documentElement.namespaceURI===SVG_NAMESPACE;



export const isSVGElementNode = (node, tagName) =>
{
	if (getPrototypeNameChain(node).endsWith(SVG_ELEMENT_PROTOTYPE_CHAIN))
	{
		return tagName===undefined || node.tagName===tagName;
	}
	else
	{
		return false;
	}
};



export const isTextNode = node => getPrototypeNameChain(node).endsWith(TEXT_PROTOTYPE_CHAIN);

export const isVoidHTMLElementNode = node => isHTMLElementNode(node) && VOID_HTML_TAG_NAMES.has(node.tagName.toLowerCase());

export const isXHTMLDocumentNode = node => isXMLDocumentNode(node) && node.documentElement.namespaceURI===XHTML_NAMESPACE;

export const isXMLDocumentNode = node => getPrototypeNameChain(node).endsWith(XML_DOCUMENT_PROTOTYPE_CHAIN);
