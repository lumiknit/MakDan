import type { Editor } from "../domi";
import * as domi from "../domi";
import { parseHTMLForMD } from "./dom";
import { findNearestBlockAncestor, newBlockElement } from "./dom-utils";
import {
	deleteBackward,
	deleteSelection,
	insertLastEmptyParagraph,
	insertParagraph,
	insertText,
	newEditorForRoot,
} from "./ed";
import { handleKey } from "./keys";
import { defaultKeyBindings } from "./keys-default";

export const mountEditor = (root: HTMLElement): Editor => {
	const ed = newEditorForRoot(root);

	let isComposing = false;
	let keyBinding = defaultKeyBindings();

	const handlers: { [k: string]: (e: Event) => void } = {
		keydown: _e => {
			const e = _e as KeyboardEvent;
			handleKey(ed, keyBinding)(e);
		},
		beforeinput: _e => {
			const e = _e as InputEvent;
			console.log("OnBeforeInput", e);
			if (isComposing) {
				e.preventDefault();
				return;
			}
			switch (e.inputType) {
				case "insertText":
					e.preventDefault();
					if (e.data) {
						insertText(ed, e.data || "");
						domi.flushBatch(ed);
					}
					break;
				case "insertParagraph":
					e.preventDefault();
					insertParagraph(ed);
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
			switch (e.inputType) {
				case "historyUndo":
				case "historyRedo":
					e.preventDefault();
					return;
				default:
					console.log("Unhandled input type", e.inputType);
					break;
			}
		},
		compositionstart: _e => {
			const e = _e as CompositionEvent;
			console.log("OnCompositionStart", e);
			isComposing = true;
		},
		compositionend: _e => {
			const e = _e as CompositionEvent;
			console.log("OnCompositionEnd", e);
			isComposing = false;
			insertText(ed, e.data || "");
			domi.flushBatch(ed);
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
			// Try to get html data
			const html = e.clipboardData?.getData("text/html");
			if (html) {
				const elem = parseHTMLForMD(html);
				const container = findNearestBlockAncestor(ed, e.target as Node);
				container.insertBefore(elem, null);
				return;
			}

			const text = e.clipboardData?.getData("text/plain");
			if (text) {
				insertText(ed, text);
				domi.flushBatch(ed);
			}
		},
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
