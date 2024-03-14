import * as domi from "../domi";

export const COMMANDS = {
	// -- Insertion
	insertText: (ed: domi.Editor, text: string) => {
		// Insert the text at current caret position
		// TODO
	},
	insertParagraph: (ed: domi.Editor) => {
		// Handle newline operation
		// TODO
	},

	// -- Deletion
	deleteBackward: (ed: domi.Editor) => {
		// Handle delete backward operation
		// TODO
	},
	deleteForward: (ed: domi.Editor) => {
		// Handle delete forward operation
		// TODO
	},

	// -- Modification
	indent: (ed: domi.Editor) => {
		// Handle indent operation
		// TODO
	},
	outdent: (ed: domi.Editor) => {
		// Handle outdent operation
		// TODO
	},

	// -- Undo/Redo
	undo: (ed: domi.Editor) => {
		// Handle undo operation
		domi.undo(ed);
	},
	redo: (ed: domi.Editor) => {
		// Handle redo operation
		domi.redo(ed);
	},
};

export const execCmd = (ed: domi.Editor, name: string, ...args: any[]) => {
	const cmd = (
		COMMANDS as { [key: string]: (ed: domi.Editor, ...args: any[]) => void }
	)[name];
	if (!cmd) {
		console.error("[execCmd] Unknown command", cmd);
		return;
	}
	cmd(ed, ...args);
};
