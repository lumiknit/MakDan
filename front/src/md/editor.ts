// Markdown Editor

// -- Types

export type InlineTypes =
	| "plain"
	| "escaped"
	| "strong"
	| "em"
	| "del"
	| "u"
	| "code"
	| "link"
	| "html";
export type Inline = {
	type: InlineTypes;
	data: any;
};

export type BlockTypes =
	| "p"
	| "h"
	| "ul"
	| "ol"
	| "li"
	| "blockquote"
	| "code"
	| "hr"
	| "img"
	| "a";
export type BlockID = number;
export type Block = {
	id: BlockID;
	type: BlockTypes;
	data: any;
	next: Block | null;
	prev: Block | null;
};

export type Editor = {
	blocks: Map<BlockID, Block>;
	currentBlockList: BlockID[];
};

// -- Helpers
