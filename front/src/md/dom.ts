// DOM Utilities for Markdown

// - Terms
// Root: The root node of markdown
// Block: The direct children of the root node, each is a block, such as paragraph, heading, etc.
// Inline: The direct children of a block, each is an inline element, such as text, link, etc.

export const isTheFirstRange = (range: Range, root: Node): boolean => {
	if (range.startOffset !== 0) return false;
	let node: Node | null = range.startContainer;
	if (node.parentElement === root) return true;
	while (node && node.parentNode !== root) {
		if (node.previousSibling) return false;
		node = node.parentNode;
	}
	return true;
};

export const splitNodeAt = (root: Node, node: Node, offset?: number): Node => {
	// Split the node at the offset.
	// Return: the new node that is created after the split which is direct child of root.

	// First, get the parent of the node
	let parent = node.parentNode;
	if (!parent) {
		return node;
	} else if (parent === root) {
		// Then, just clone node
		const cloned = node.cloneNode(false);
		parent.insertBefore(cloned, node.nextSibling);
		return cloned;
	}

	// Split the parent into two part
	let left = node;
	let right = parent.cloneNode(false);

	// Push the target node to the clone
	if (left.nodeType === Node.TEXT_NODE) {
		// Then, split at offset
		const newTextNode = (left as Text).splitText(offset || 0);
		right.appendChild(newTextNode);
	}

	// Traverse the right side of the original node
	while (left.nextSibling) {
		right.appendChild(left.nextSibling);
	}

	left = parent;
	parent = parent.parentNode;

	while (parent && parent !== root) {
		// Split the parent into two part
		const parentRight = parent.cloneNode(false);
		parentRight.appendChild(right);
		right = parentRight;
		left = parent;
		parent = parent.parentNode;
	}

	// Now, parent is the root
	console.log(left, right);
	root.insertBefore(right, left.nextSibling);
	return right;
};

export const concatToPreviousNode = (node: Node): Node | null => {
	console.log("CC");
	// Check if the previous node exists.
	const previous = node.previousSibling;
	if (previous) {
		// Then, pass all the children to the previous node.
		const ret = node.firstChild;
		while (node.firstChild) {
			previous.appendChild(node.firstChild);
		}
		// Remove the node
		node.parentNode?.removeChild(node);
		return ret;
	}
	return null;
};
