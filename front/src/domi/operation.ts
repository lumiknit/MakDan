import { assignElemID, type IDStore } from "./id";

// -- Types

// Operation Type Enum
export enum OpType {
	UpdateText,
	InsertElem,
	DeleteElem,
}

// Operations

// Replace the first text node's text content
export type OpUpdateText = {
	type: OpType.UpdateText;
	elem: HTMLElement;

	// Update index
	offset: number;

	// Text before and after the update
	before: string;
	after: string;
};

// Insert a node into the parent node
export type OpInsertElem = {
	type: OpType.InsertElem;
	elem: HTMLElement;
	parent: HTMLElement;
	next: undefined | null | Node;
	// Undefined: Insert as the first child of the parent
	// Null: Insert as the last child of the parent
	// Otherwise, Insert before the next node
};

// Delete a node
export type OpDeleteElem = {
	type: OpType.DeleteElem;
	elem: HTMLElement;
	parent: HTMLElement;
	next: null | Node;
};

export type Operation = OpUpdateText | OpInsertElem | OpDeleteElem;

// Batch related types

// Selection range
export type Range = {
	anchorNode: Node;
	anchorOffset: number;
	focusNode: Node;
	focusOffset: number;
};

// A batch of operations
export type Batch = {
	ops: Operation[];

	// The range after the batch finished
	range: Range;
};

// History manager
export type History = {
	pastBatches: Batch[];
	futBatches: Batch[];

	// Current constructing batch
	curBatch: Batch;
};

type Context = IDStore & History;

// -- Methods

const initialBatch = (): Batch => ({
	ops: [],
	range: {
		anchorNode: null as any,
		anchorOffset: 0,
		focusNode: null as any,
		focusOffset: 0,
	},
});

export const initHistory = <T extends object>(o: T): T & History => ({
	...o,
	pastBatches: [initialBatch()],
	futBatches: [],
	curBatch: initialBatch(),
});

const getSelection = (): Selection => {
	// Wrap window.getSelection to throw error
	const sel = window.getSelection();
	if (sel === null) {
		throw new Error("Failed to get selection");
	}
	return sel;
};

export const currentRange = (): Range => {
	// Get selection
	const sel = getSelection();
	if (sel.anchorNode === null) throw new Error("No anchor node");
	const focusNode = sel.focusNode || sel.anchorNode;
	const focusOffset =
		sel.focusNode === null ? sel.anchorOffset : sel.focusOffset;
	return {
		anchorNode: sel.anchorNode,
		anchorOffset: sel.anchorOffset,
		focusNode,
		focusOffset,
	};
};

// Getter for text nodes

const getInnerTextNode = (elem: HTMLElement): Node => {
	// Try to get the first node
	const node = elem.firstChild;
	if (node === null) {
		// If the element is empty, create a text node
		const textNode = document.createTextNode("");
		elem.appendChild(textNode);
		return textNode;
	}
	if (node.nodeType !== Node.TEXT_NODE) {
		throw new Error("First child is not a text node");
	}
	return node;
};

const getElem = (node: Node): HTMLElement => {
	if (node.nodeType === Node.TEXT_NODE) {
		if (node.parentNode === null) {
			throw new Error("Text node has no parent");
		}
		node = node.parentNode;
	}
	if (node.nodeType !== Node.ELEMENT_NODE) {
		throw new Error("Not an element node");
	}
	return node as HTMLElement;
};

const doOp = (op: Operation): void => {
	// Execute the operation in forward
	switch (op.type) {
		case OpType.UpdateText: {
			const textNode = getInnerTextNode(op.elem);
			const text = textNode.textContent || "";
			textNode.textContent =
				text.slice(0, op.offset) +
				op.after +
				text.slice(op.offset + op.before.length);
			break;
		}
		case OpType.InsertElem: {
			op.parent.insertBefore(
				op.elem,
				op.next === undefined ? op.parent.firstChild : op.next,
			);
			break;
		}
		case OpType.DeleteElem: {
			op.parent.removeChild(op.elem);
			break;
		}
	}
};

const undoOp = (op: Operation): void => {
	// Execute the operation in backward
	switch (op.type) {
		case OpType.UpdateText: {
			const textNode = getInnerTextNode(op.elem);
			const text = textNode.textContent || "";
			textNode.textContent =
				text.slice(0, op.offset) +
				op.before +
				text.slice(op.offset + op.after.length);
			break;
		}
		case OpType.InsertElem: {
			op.parent.removeChild(op.elem);
			break;
		}
		case OpType.DeleteElem: {
			op.parent.insertBefore(op.elem, op.next);
			break;
		}
	}
};

export const undo = (ctx: Context): void => {
	// First of all, flush current batch
	flushBatch(ctx);

	// Check if there is any batch to undo
	if (ctx.pastBatches.length <= 1) {
		return;
	}

	// Pop the last batch
	console.log("[domi] undo");
	const batch = ctx.pastBatches.pop()!;
	ctx.futBatches.push(batch);

	// Undo each operation in the batch
	for (let i = batch.ops.length - 1; i >= 0; i--) {
		undoOp(batch.ops[i]);
	}

	// Move the range to the previous batch
	const prevRange = ctx.pastBatches[ctx.pastBatches.length - 1].range;
	const sel = getSelection();
	sel.setBaseAndExtent(
		prevRange.anchorNode,
		prevRange.anchorOffset,
		prevRange.focusNode,
		prevRange.focusOffset,
	);
};

export const redo = (ctx: Context): void => {
	// First of all, flush current batch
	flushBatch(ctx);

	// Check if there is any batch to redo
	if (ctx.futBatches.length <= 0) {
		return;
	}

	// Pop the next batch
	console.log("[domi] redo");
	const batch = ctx.futBatches.pop()!;
	ctx.pastBatches.push(batch);

	// Redo each operation in the batch
	for (const op of batch.ops) {
		doOp(op);
	}

	// Move the range to the next batch
	const nextRange = batch.range;
	const sel = getSelection();
	sel.setBaseAndExtent(
		nextRange.anchorNode,
		nextRange.anchorOffset,
		nextRange.focusNode,
		nextRange.focusOffset,
	);
};

export const freezeHistory = (ctx: Context): void => {
	// Flush current batch
	flushBatch(ctx);

	// Remove all history
	ctx.pastBatches = [ctx.curBatch];
	ctx.futBatches = [];
};

const pushOp = (ctx: Context, op: Operation, dry?: boolean): void => {
	ctx.curBatch.ops.push(op);
	if (!dry) doOp(op);
};

const mergeOpUpdateTextToPrev = (
	prev: OpUpdateText,
	next: OpUpdateText,
): boolean => {
	// If possible, merge the next operation to the previous one

	const prevStart = prev.offset;
	const prevEnd = prev.offset + prev.after.length;
	const nextStart = next.offset;
	const nextEnd = next.offset + next.before.length;

	// If node is different, or updated range is not overlapped, cannot merge
	if (prev.elem !== next.elem || prevEnd < nextStart || nextEnd < prevStart)
		return false;

	let before = prev.before;
	let after = next.after;
	if (nextStart < prevStart) {
		before = next.before.slice(0, prevStart - nextStart) + before;
	} else {
		after = prev.after.slice(0, nextStart - prevStart) + after;
	}
	if (nextEnd > prevEnd) {
		before += next.before.slice(next.before.length - (nextEnd - prevEnd));
	} else {
		after += prev.after.slice(prev.after.length - (prevEnd - nextEnd));
	}

	prev.offset = Math.min(prevStart, nextStart);
	prev.before = before;
	prev.after = after;
	return true;
};

export const insertText = (
	ctx: Context,
	node: Node,
	offset: number,
	text: string,
	dry?: boolean,
): void =>
	pushOp(
		ctx,
		{
			type: OpType.UpdateText,
			elem: getElem(node),
			offset,
			before: "",
			after: text,
		},
		dry,
	);

export const deleteText = (
	ctx: Context,
	node: Node,
	offset: number,
	length: number,
): void => {
	const text = (node.textContent || "").slice(offset, offset + length);
	pushOp(ctx, {
		type: OpType.UpdateText,
		elem: getElem(node),
		offset,
		before: text,
		after: "",
	});
};

export const insertElem = (
	ctx: Context,
	elem: HTMLElement,
	parent: HTMLElement,
	next?: HTMLElement | null,
	dry?: boolean,
): void => {
	assignElemID(ctx, elem);
	pushOp(
		ctx,
		{
			type: OpType.InsertElem,
			elem,
			parent,
			next,
		},
		dry,
	);
};

export const insertElemFirst = (
	ctx: Context,
	elem: HTMLElement,
	parent: HTMLElement,
	dry?: boolean,
): void => insertElem(ctx, elem, parent, undefined, dry);

export const insertElemLast = (
	ctx: Context,
	elem: HTMLElement,
	parent: HTMLElement,
	dry?: boolean,
): void => insertElem(ctx, elem, parent, null, dry);

export const deleteElem = (
	ctx: Context,
	elem: HTMLElement,
	dry?: boolean,
): void => {
	return pushOp(ctx, {
		type: OpType.DeleteElem,
		elem,
		parent: elem.parentElement!,
		next: elem.nextSibling,
	});
};

export const flushBatch = (history: History, range?: Range): void => {
	if (history.curBatch.ops.length <= 0) {
		// Nothing to flush
		return;
	}
	// First of all, group updateText operations if possible
	const ops: Operation[] = [];
	for (const op of history.curBatch.ops) {
		if (ops.length > 0 && op.type === OpType.UpdateText) {
			const lastOp = ops[ops.length - 1];
			if (
				lastOp.type === OpType.UpdateText &&
				mergeOpUpdateTextToPrev(lastOp, op)
			) {
				continue;
			}
		}
		ops.push(op);
	}

	// Convert range to domi's range
	range = range ?? currentRange();

	// Flush current batch
	history.curBatch.ops = ops;
	history.curBatch.range = range;
	history.pastBatches.push(history.curBatch);
	history.curBatch = initialBatch();
	if (history.futBatches.length > 0) {
		history.futBatches = [];
	}
	console.log("[domi] flushed", history.pastBatches);
};

export const getHistorySize = (history: History): number =>
	history.pastBatches.length + history.futBatches.length;

// For test
export const _test = {
	mergeOpUpdateTextToPrev,
};
