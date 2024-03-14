export const setCaretPosition = (container: Node, offset: number): void => {
	const sel = window.getSelection();
	if (sel === null) return;
	const range = document.createRange();
	range.setStart(container, offset);
	range.collapse(true);
	sel.removeAllRanges();
	sel.addRange(range);
};

export const findNearestAncestorWithClass = (
	node: Node,
	className: string,
): Node | null => {
	while (node) {
		if (node instanceof Element && node.classList.contains(className)) {
			return node;
		}
		node = node.parentNode!;
	}
	return null;
};

export const newElement = (tagName: string, classes: string[]): HTMLElement => {
	const el = document.createElement(tagName);
	el.classList.add(...classes);
	return el;
};
