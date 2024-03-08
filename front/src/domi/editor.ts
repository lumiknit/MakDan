import { assignNodeID, initIDStore, type IDStore } from "./id";
import { initHistory, type History } from "./operation";

export type Editor = {
	root: HTMLElement;
} & IDStore &
	History;

export const newEditor = (root: HTMLElement): Editor => {
	const o = {
		root,
	};
	const withIDStore = initIDStore(o);
	const editor = initHistory(withIDStore);
	// Set root element as the first node
	assignNodeID(editor, root);
	return editor;
};
