import { assignNodeID, getNodeByID, getNodeID, type IDStore, type NodeID } from "./id";

// -- Types

// Operation Type Enum
export enum OpType {
	UpdateText,
	InsertNode,
	DeleteNode,
}

// Operations

// Replace the textContent in the text node
export type OpUpdateText = {
	type: OpType.UpdateText;
	nodeID: NodeID;

	// Update index
	offset: number;

	// Text before and after the update
	before: string;
	after: string;
};

// Insert a node into the parent node
export type OpInsertNode = {
	type: OpType.InsertNode;
	nodeID: NodeID;
} & (
	| { parentID: NodeID } // Inserted as the first child of the parent
	| { nextID: NodeID } // Inserted before the next node
);

// Delete a node
export type OpDeleteNode = {
	type: OpType.DeleteNode;
	nodeID: NodeID;
} & (
	| { parentID: NodeID } // Removed the first child of the parent
	| { nextID: NodeID } // Removed before the next node
);

export type Operation = OpUpdateText | OpInsertNode | OpDeleteNode;

// Batch related types

// Selection range
export type Range = {
	anchorID: NodeID;
	anchorOffset: number;
	focusID: NodeID;
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
		anchorID: 0,
		anchorOffset: 0,
		focusID: 0,
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
	return sel.anchorNode === null || sel.focusNode === null
		? {
				anchorID: 0,
				anchorOffset: 0,
				focusID: 0,
				focusOffset: 0,
			}
		: {
				anchorID: getNodeID(sel.anchorNode),
				anchorOffset: sel.anchorOffset,
				focusID: getNodeID(sel.focusNode),
				focusOffset: sel.focusOffset,
			};
};

const doOp = (ctx: Context, op: Operation): void => {
	// Execute the operation in forward
	const node = getNodeByID(ctx, op.nodeID);
	switch (op.type) {
		case OpType.UpdateText: {
			const text = node.textContent || "";
			node.textContent =
				text.slice(0, op.offset) +
				op.after +
				text.slice(op.offset + op.before.length);
			break;
		}
		case OpType.InsertNode: {
			if ("parentID" in op) {
				console.log(op);
				const parent = getNodeByID(ctx, op.parentID);
				parent.insertBefore(node, parent.firstChild);
			} else {
				const next = getNodeByID(ctx, op.nextID);
				next.parentNode!.insertBefore(node, next);
			}
			break;
		}
		case OpType.DeleteNode: {
			node.parentNode!.removeChild(node);
			break;
		}
	}
};

const undoOp = (ctx: Context, op: Operation): void => {
	// Execute the operation in backward
	const node = getNodeByID(ctx, op.nodeID);
	switch (op.type) {
		case OpType.UpdateText: {
			const text = node.textContent || "";
			node.textContent =
				text.slice(0, op.offset) +
				op.before +
				text.slice(op.offset + op.after.length);
			break;
		}
		case OpType.InsertNode: {
			node.parentNode!.removeChild(node);
			break;
		}
		case OpType.DeleteNode: {
			if ("parentID" in op) {
				const parent = getNodeByID(ctx, op.parentID);
				parent.insertBefore(node, parent.firstChild);
			} else {
				const next = getNodeByID(ctx, op.nextID);
				next.parentNode!.insertBefore(node, next);
			}
			break;
		}
	}
};

export const undo = (ctx: Context): void => {
	console.log(ctx.pastBatches);
	if (ctx.pastBatches.length <= 1) {
		return;
	}
	console.log("[domi] undo");
	const batch = ctx.pastBatches.pop()!;
	ctx.futBatches.push(batch);
	for (let i = batch.ops.length - 1; i >= 0; i--) {
		undoOp(ctx, batch.ops[i]);
	}
	// Move the range to the previous batch
	const prevRange = ctx.pastBatches[ctx.pastBatches.length - 1].range;
	const sel = getSelection();
	const anchor = getNodeByID(ctx, prevRange.anchorID);
	const focus = getNodeByID(ctx, prevRange.focusID);
	sel.setBaseAndExtent(
		anchor,
		prevRange.anchorOffset,
		focus,
		prevRange.focusOffset,
	);
};

export const redo = (ctx: Context): void => {
	if (ctx.futBatches.length <= 0) {
		return;
	}
	console.log("[domi] redo");
	const batch = ctx.futBatches.pop()!;
	ctx.pastBatches.push(batch);
	for (const op of batch.ops) {
		doOp(ctx, op);
	}
	// Move the range to the next batch
	const nextRange = batch.range;
	const sel = getSelection();
	const anchor = getNodeByID(ctx, nextRange.anchorID);
	const focus = getNodeByID(ctx, nextRange.focusID);
	sel.setBaseAndExtent(
		anchor,
		nextRange.anchorOffset,
		focus,
		nextRange.focusOffset,
	);
};

const pushOpToBatch = (ctx: Context, op: Operation): void => {
	ctx.curBatch.ops.push(op);
	doOp(ctx, op);
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
	if (prev.nodeID !== next.nodeID || prevEnd < nextStart || nextEnd < prevStart)
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
): void =>
	pushOpToBatch(ctx, {
		type: OpType.UpdateText,
		nodeID: getNodeID(node),
		offset,
		before: "",
		after: text,
	});

export const deleteText = (
	ctx: Context,
	node: Node,
	offset: number,
	length: number,
): void => {
	const text = (node.textContent || "").slice(offset, offset + length);
	pushOpToBatch(ctx, {
		type: OpType.UpdateText,
		nodeID: getNodeID(node),
		offset,
		before: text,
		after: "",
	});
};

export const insertNodeAtFirst = (
	ctx: Context,
	node: Node,
	parent: Node,
): void =>
	pushOpToBatch(ctx, {
		type: OpType.InsertNode,
		nodeID: assignNodeID(ctx, node),
		parentID: getNodeID(parent),
	});

export const insertNodeBefore = (ctx: Context, node: Node, next: Node): void =>
	pushOpToBatch(ctx, {
		type: OpType.InsertNode,
		nodeID: assignNodeID(ctx, node),
		nextID: getNodeID(next),
	});

export const deleteNode = (ctx: Context, node: Node): void => {
	const o: {
		type: OpType.DeleteNode;
		nodeID: NodeID;
	} = {
		type: OpType.DeleteNode,
		nodeID: assignNodeID(ctx, node),
	};
	const next = node.nextSibling;
	const deleteOp: OpDeleteNode =
		next === null
			? { ...o, parentID: getNodeID(node.parentNode!) }
			: { ...o, nextID: getNodeID(next) };
	return pushOpToBatch(ctx, deleteOp);
};

export const flushBatch = (history: History, range?: Range): void => {
	// First of all, group updateText operations if possible
	const ops: Operation[] = [];
	for (const op of history.curBatch.ops) {
		if (ops.length > 0 && op.type === OpType.UpdateText) {
			const lastOp = ops[ops.length - 1];
			if (lastOp.type === OpType.UpdateText && mergeOpUpdateTextToPrev(lastOp, op)) {
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
