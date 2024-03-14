// DOM-style markdown helpers

import {
	CLS_IN,
	CLS_INLINE,
	CLS_META,
	CLS_M_CLOSE,
	CLS_M_OPEN,
} from "./consts";
import { newElement } from "./dom-utils";

export const EMPTY_CHAR_STRING = " ";

export const isEmptyText = (s: any): boolean => !s || s === EMPTY_CHAR_STRING;

export const newInlineMetaElem = (
	tag: string,
	open: string,
	close: string,
): HTMLElement => {
	const openElem = newElement("span", [CLS_META, CLS_M_OPEN]);
	openElem.textContent = open;

	const closeElem = newElement("span", [CLS_META, CLS_M_CLOSE]);
	closeElem.textContent = close;

	const inner = newElement(tag, [CLS_IN]);

	const elem = newElement(tag, [CLS_INLINE]);
	elem.appendChild(openElem);
	elem.appendChild(inner);
	elem.appendChild(closeElem);
	return elem;
};

// -- HTML Parser

export const parseHTMLForMD = (html: string): HTMLElement => {
	// Parse the given html string and replace all unwanted tags
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");

	console.log(doc.body);

	// Remove all style properties
	for (const elem of doc.querySelectorAll("*")) {
		elem.setAttribute("style", "");
	}

	return doc.body;
};
