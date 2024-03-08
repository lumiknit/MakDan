export type NodeID = number;

export type IDStore = {
	idCnt: number;
	idMap: Map<NodeID, Node>;
};

export const initIDStore = <T extends object>(o: T): T & IDStore => {
	return {
		...o,
		idCnt: 0,
		idMap: new Map(),
	};
};

export const assignNodeID = (idStore: IDStore, node: Node): NodeID => {
	if ((node as any)._domid !== undefined) {
		return (node as any)._domid;
	}
	const id = idStore.idCnt++;
	idStore.idMap.set(id, node);
	(node as any)._domid = id;
	return id;
};

export const getNodeID = (node: Node): NodeID => {
	return (node as any)._domid;
};

export const getNodeByID = (idStore: IDStore, id: NodeID): Node => {
	const n = idStore.idMap.get(id);
	if (n === undefined) {
		throw new Error(`Node with id ${id} not found`);
	}
	return n;
};

export const deleteNodeByID = (idStore: IDStore, id: NodeID): void => {
	idStore.idMap.delete(id);
};
