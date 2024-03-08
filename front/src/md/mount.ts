import type { Editor } from "../domi";
import * as domi from "../domi";

const deleteRange = (
	ed: Editor,
	startContainer: Node,
	startOffset: number,
	endContainer: Node,
	endOffset: number,
) => {
	// If start and end are same container
	if (startContainer === endContainer) {
		console.log("[deleteSelection] start and end are same container", startContainer, startOffset, endOffset);
		// Then, just delete the text
		domi.deleteText(ed, startContainer, startOffset, endOffset - startOffset);
	} else {
		// Otherwise, First of all, delete text from start and end container
		console.log("[deleteSelection] start and end are different container", startContainer, startOffset, endContainer, endOffset);
		domi.deleteText(ed, startContainer, startOffset, startContainer.textContent?.length || 0);
		domi.deleteText(ed, endContainer, 0, endOffset);
		// TODO:
	}

	// Collapse selection to start
	domi.setCaretPosition(startContainer, startOffset);
}

const deleteSelection = (ed: Editor): void => {
	const sel = window.getSelection();
	if (sel === null || sel.focusNode === null || sel.anchorNode === null) {
		return;
	}
	const range = sel.getRangeAt(0);
	return deleteRange(ed, range.startContainer, range.startOffset, range.endContainer, range.endOffset);
};

const deleteBackward = (ed: Editor): void => {
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


const insertText = (ed: Editor, text: string): void => {
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

	if (container.nodeType !== Node.TEXT_NODE) {
		console.log("[insertText] add text node");
		// If container is not text node, add a text node at first
		const textNode = document.createTextNode(text);
		domi.insertNodeAtFirst(ed, textNode, container);
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
};


export const mountEditor = (root: HTMLElement): Editor => {
	const ed = domi.newEditor(root);
	const handlers: {[k: string]: (e: Event) => void} = {
		keydown: _e => {
			const e = _e as KeyboardEvent;
			if((e.ctrlKey || e.metaKey) && e.key === "z") {
				e.preventDefault();
				if (e.shiftKey) {
					console.log("Redo");
					domi.redo(ed);
				} else {
					console.log("Undo");
					domi.undo(ed);
				}
			}
		},
		beforeinput: _e => {
			const e = _e as InputEvent;
			console.log("OnBeforeInput", e);
			switch(e.inputType) {
				case "insertText":
					e.preventDefault();
					if (e.data) {
						insertText(ed, e.data || "");
						domi.flushBatch(ed);
					}
					break;
				case "insertParagraph":
					e.preventDefault();
					insertText(ed, "\n");
					domi.flushBatch(ed);
					break;
				case "deleteContentBackward":
					e.preventDefault();
					deleteBackward(ed);
					domi.flushBatch(ed);
					break;
			}
		},
		input: _e => {
			const e = _e as InputEvent;
			console.log("OnInput", e);
			switch(e.inputType) {
				case "historyUndo":
				case "historyRedo":
					e.preventDefault();
					return;
				default:
					console.log("Unhandled input type", e.inputType);
					break;
			}
		},
		cut: _e => {
			const e = _e as ClipboardEvent;
			console.log("OnCut", e);
			e.preventDefault();
			deleteSelection(ed);
			domi.flushBatch(ed);
		},
		paste: _e => {
			const e = _e as ClipboardEvent;
			console.log("OnPaste", e);
			e.preventDefault();
			const text = e.clipboardData?.getData("text/plain");
			if (text) {
				insertText(ed, text);
				domi.flushBatch(ed);
			}
		}
	};

	// Add all event listeners
	for (const [k, v] of Object.entries(handlers)) {
		ed.root.addEventListener(k, v);
	}

	// Set content editable
	root.contentEditable = "true";

	// Set to show whitespace
	root.style.whiteSpace = "pre-wrap";
	return ed;
};
