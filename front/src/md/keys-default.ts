// Default keybinding

import { execCmd } from "./commands";
import type { KeyBindings } from "./keys";

export const defaultKeyBindings = (): KeyBindings =>
	new Map([
		[
			"C-z",
			ed => {
				execCmd(ed, "undo");
			},
		],
		[
			"C-S-z",
			ed => {
				execCmd(ed, "redo");
			},
		],
	]);
