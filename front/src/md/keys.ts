import * as domi from "../domi";

export const keyEventToStroke = (ev: KeyboardEvent): string => {
	let p = ev.key.toUpperCase();
	if (ev.shiftKey) {
		p = "S-" + p;
	}
	if (ev.altKey) {
		p = "A-" + p;
	}
	if (ev.ctrlKey || ev.metaKey) {
		p = "C-" + p;
	}
	return p;
};

export type KeyBindings = Map<
	string,
	(ed: domi.Editor, ev: KeyboardEvent) => void
>;

export const handleKey =
	(ed: domi.Editor, keyBindings: KeyBindings) =>
	(ev: KeyboardEvent): boolean => {
		const stroke = keyEventToStroke(ev);
		const handler = keyBindings.get(stroke);
		if (handler) {
			handler(ed, ev);
			ev.preventDefault();
			return true;
		}
		return false;
	};
