// DOM Helper with editor

import * as domi from "../domi";
import { isEmptyText } from "./dom";

import { findNearestBlockAncestor, newBlockElement } from "./dom-utils";

export const insertLastEmptyParagraph = (ed: domi.Editor): void => {
	// Check if the last block is empty
	const lastBlock = ed.root.lastElementChild;
	console.log(lastBlock, lastBlock?.tagName, lastBlock?.textContent);
	if (
		lastBlock === null ||
		lastBlock.tagName !== "P" ||
		!isEmptyText(lastBlock.textContent)
	) {
		// If not, insert a new paragraph
		const p = newBlockElement("p", []);
		domi.insertNode(ed, p, ed.root, null);
		const t = document.createTextNode(" ");
		domi.insertNode(ed, t, p);
	}
};

// -- Deletion

export const deleteRange = (
	ed: domi.Editor,
	startContainer: Node,
	startOffset: number,
	endContainer: Node,
	endOffset: number,
) => {
	// If start and end are same container
	if (startContainer === endContainer) {
		console.log(
			"[deleteSelection] start and end are same container",
			startContainer,
			startOffset,
			endOffset,
		);
		// Then, just delete the text
		domi.deleteText(ed, startContainer, startOffset, endOffset - startOffset);
	} else {
		// Otherwise, First of all, delete text from start and end container
		console.log(
			"[deleteSelection] start and end are different container",
			startContainer,
			startOffset,
			endContainer,
			endOffset,
		);
		domi.deleteText(
			ed,
			startContainer,
			startOffset,
			startContainer.textContent?.length || 0,
		);
		domi.deleteText(ed, endContainer, 0, endOffset);
		// TODO:
	}

	// Collapse selection to start
	domi.setCaretPosition(startContainer, startOffset);
};

export const deleteSelection = (ed: domi.Editor): void => {
	const sel = window.getSelection();
	if (sel === null || sel.focusNode === null || sel.anchorNode === null) {
		return;
	}
	const range = sel.getRangeAt(0);
	return deleteRange(
		ed,
		range.startContainer,
		range.startOffset,
		range.endContainer,
		range.endOffset,
	);
};

export const deleteBackward = (ed: domi.Editor): void => {
	const sel = window.getSelection();
	if (sel === null || sel.focusNode === null) {
		return;
	}
	if (sel.isCollapsed) {
		const container = sel.focusNode;
		const offset = sel.focusOffset;
		if (offset > 0) {
			deleteRange(ed, container, offset - 1, container, offset);
		}
	} else {
		deleteSelection(ed);
	}
};

// -- Insertion

export const insertText = (ed: domi.Editor, text: string): void => {
	console.log("[insertText]", text);

	const sel = window.getSelection();
	if (sel === null || sel.focusNode === null) return;

	// If selection is not collapsed, then delete the selection
	if (!sel.isCollapsed) {
		console.log("[insertText] selection is not collapsed");
		deleteSelection(ed);
	}

	let container = sel.focusNode;
	let offset = sel.focusOffset;

	// If container is text node and empty, insert a paragraph

	if (container.nodeType !== Node.TEXT_NODE) {
		console.log("[insertText] add text node");
		// If container is not text node, add a text node at first
		const textNode = document.createTextNode(text);
		domi.insertNode(ed, textNode, container);
		container = textNode;
		offset = text.length;
	} else {
		console.log("[insertText] insert just text", container, offset);
		// Otherwise just insert the text
		domi.insertText(ed, container, offset, text);
		offset += text.length;
	}

	// Move cursor
	domi.setCaretPosition(container, offset);
	insertLastEmptyParagraph(ed);
};

export const insertParagraph = (ed: domi.Editor): Node => {
	// Find the nearest block ancestor
	const sel = window.getSelection();
	if (sel === null || sel.focusNode === null) throw "BOOM";
	const container = findNearestBlockAncestor(ed, sel.focusNode);
	// Create a paragraph
	const p = newBlockElement("p", []);
	// Insert the paragraph
	console.log("[insertParagraph] insert paragraph", p, container);
	domi.insertNode(ed, p, container.parentNode!, container.nextSibling);
	return p;
};

// -- Mount

export const newEditorForRoot = (root: HTMLElement): domi.Editor => {
	const ed = domi.newEditor(root);
	insertLastEmptyParagraph(ed);
	domi.freezeHistory(ed);
	return ed;
};
