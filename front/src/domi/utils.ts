export const setCaretPosition = (container: Node, offset: number): void => {
	const sel = window.getSelection();
	if (sel === null) return;
	const range = document.createRange();
	range.setStart(container, offset);
	range.collapse(true);
	sel.removeAllRanges();
	sel.addRange(range);
}
