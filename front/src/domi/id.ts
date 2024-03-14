export const ELEM_ID_KEY = "data-domi-id";
export type ElemID = string;

export type IDStore = {
	idPrefix: string;
	idCnt: number;
};

export const initIDStore = <T extends object>(o: T): T & IDStore => {
	// Random base-36 string
	const idPrefix = `domi-${Math.random().toString(36).slice(2)}-`;
	return {
		...o,
		idPrefix,
		idCnt: 0,
	};
};

export const issueID = (idStore: IDStore): ElemID =>
	idStore.idPrefix + idStore.idCnt++;

export const getElemID = (elem: HTMLElement): ElemID | null =>
	elem.getAttribute(ELEM_ID_KEY);

export const assignElemID = (idStore: IDStore, elem: HTMLElement): ElemID => {
	let id = getElemID(elem);
	if (!id) {
		id = issueID(idStore);
		elem.setAttribute(ELEM_ID_KEY, id);
	}
	return id;
};
