import type { Editor } from "../domi";
import { CLS_BLOCK } from "./consts";

const hasClass = (node: Node, className: string): boolean =>
	"classList" in node && (node as Element).classList.contains(className);

export const findNearestBlockAncestor = (ed: Editor, node: Node): Node => {
	while (node && node !== ed.root) {
		if (hasClass(node, CLS_BLOCK)) {
			return node;
		}
		node = node.parentNode!;
	}
	return ed.root;
};

export const newElement = (tagName: string, classes: string[]): HTMLElement => {
	const el = document.createElement(tagName);
	classes.forEach(cls => el.classList.add(cls));
	return el;
};

export const newBlockElement = (
	tagName: string,
	classes: string[],
): HTMLElement => {
	return newElement(tagName, [...classes, CLS_BLOCK]);
};
