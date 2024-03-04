import { concatToPreviousNode, isTheFirstRange, splitNodeAt } from "./dom";

type EventHandler = (e: any) => void;
type EventHandlers = { [key: string]: EventHandler };

export type Context = {
	root: HTMLElement;
	handlers: EventHandlers;
	documentHandlers: EventHandlers;
};

// -- Constructor / Destructor

export const installContext = (root: HTMLElement): Context => {
	const ctx: Context = {
		root,
		handlers: {},
		documentHandlers: {},
	};

	// Add event listeners
	const handlers: EventHandlers = {
		keydown: handleKeydown(ctx),
		beforeinput: handleBeforeInput(ctx),
		input: handleInput(ctx),
		cut: handleCut(ctx),
		copy: handleCopy(ctx),
		paste: handlePaste(ctx),
	};
	for (const key in handlers) {
		root.addEventListener(key, handlers[key]);
	}
	ctx.handlers = handlers;

	// Add document event listeners
	const documentHandlers: EventHandlers = {
		selectionchange: handleSelectionChange(ctx),
	};
	for (const key in documentHandlers) {
		document.addEventListener(key, documentHandlers[key]);
	}
	ctx.documentHandlers = documentHandlers;

	// Set to empty content
	root.innerHTML = "";
	root.appendChild(document.createElement("p"));

	return ctx;
};

export const uninstallContext = (ctx: Context): void => {
	// Remove event listeners
	for (const key in ctx.handlers) {
		ctx.root.removeEventListener(key, ctx.handlers[key]);
	}
	for (const key in ctx.documentHandlers) {
		document.removeEventListener(key, ctx.documentHandlers[key]);
	}
};

// -- Event Handlers

const handleKeydown = (ctx: Context) => (e: KeyboardEvent) => {
	switch (e.key) {
		case "Enter":
			insertNewline(ctx);
			e.preventDefault();
			break;
		case "Backspace":
			{
				let range = window.getSelection()?.getRangeAt(0);
				if (range && range.collapsed) {
					console.log("Range, collapsed");
					if (isTheFirstRange(range, ctx.root)) {
						// Then, just merge to the previous node
						const node = findBlock(ctx, range.startContainer);
						const newNode = concatToPreviousNode(node);
						if (newNode) {
							range.setStart(newNode, 0);
							range.collapse(true);
						}
						e.preventDefault();
						return;
					}
				}
			}
			break;
	}
};

const handleBeforeInput = (ctx: Context) => (e: InputEvent) => {
	switch (e.inputType) {
		case "historyUndo":
			e.preventDefault();
			alert("Undo has been canceled");
			break;
		case "historyRedo":
			e.preventDefault();
			alert("Redo has been canceled");
			break;
	}
};

const handleInput = (ctx: Context) => (e: InputEvent) => {};

const handleCut = (ctx: Context) => (e: ClipboardEvent) => {
	// Change contents to test
	const data = e.clipboardData;
	data?.setData("text/plain", "You can't cut this!");
	e.preventDefault();
};

const handleCopy = (ctx: Context) => (e: ClipboardEvent) => {
	// Change contents to test
	const data = e.clipboardData;
	data?.setData("text/plain", "You can't copy this!");
	e.preventDefault();
};

const handlePaste = (ctx: Context) => (e: ClipboardEvent) => {
	// Paste as plain text
	e.preventDefault();
	const data = e.clipboardData;
	const text = data?.getData("text/plain");
	if (text) {
		document.execCommand("insertText", false, text);
	}
};

const handleSelectionChange = (ctx: Context) => (e: Event) => {};

// -- DOM Manipulation

const isSelectionInRoot = (ctx: Context): boolean => {
	const selection = window.getSelection();
	if (selection) {
		const range = selection.getRangeAt(0);
		return ctx.root.contains(range.commonAncestorContainer);
	}
	return false;
};

const findBlock = (ctx: Context, node: Node): Node => {
	// Find the block (container in the root)
	while (node.parentNode && node.parentNode !== ctx.root) {
		node = node.parentNode;
	}
	return node;
};

const insertNewline = (ctx: Context) => {
	// Check selection is in a block
	if (!isSelectionInRoot(ctx)) {
		return;
	}

	const selection = getSelection();
	if (selection) {
		const range = selection.getRangeAt(0);
		range.deleteContents();

		// Split the node at the offset.
		const rangeContainer = range.startContainer;
		const rangeOffset = range.startOffset;

		const splittedRight = splitNodeAt(
			ctx.root,
			rangeContainer,
			rangeOffset,
		);

		// Move the cursor into the new block
		const newRange = document.createRange();
		newRange.setStart(splittedRight, 0);
		selection.removeAllRanges();
		selection.addRange(newRange);
	}
};
