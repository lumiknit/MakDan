import { expect, test } from "vitest";

import * as id from "./id";

test("initIDStore", () => {
	const store = id.initIDStore({});
	expect(store.idCnt).toBe(0);
	expect(store.idMap).toBeInstanceOf(Map);
	expect(store.idMap.size).toBe(0);
});

test("assignNodeID", () => {
	const store = id.initIDStore({});
	const node = {} as any;
	const id1 = id.assignNodeID(store, node);
	expect(id1).toBe(0);
	expect(store.idCnt).toBe(1);
	expect(store.idMap.size).toBe(1);
	expect(store.idMap.get(id1)).toBe(node);
	const id2 = id.assignNodeID(store, node);
	expect(id2).toBe(0);
});

test("getNodeID", () => {
	const node = {} as any;
	const id1 = id.assignNodeID(id.initIDStore({}), node);
	expect(id.getNodeID(node)).toBe(id1);
});

test("getNodeByID", () => {
	const store = id.initIDStore({});
	const node = {} as any;
	const id1 = id.assignNodeID(store, node);
	expect(id.getNodeByID(store, id1)).toBe(node);
	expect(() => id.getNodeByID(store, id1 + 1)).toThrow();
});

test("deleteNodeByID", () => {
	const store = id.initIDStore({});
	const node = {} as any;
	const id1 = id.assignNodeID(store, node);
	expect(store.idMap.size).toBe(1);
	id.deleteNodeByID(store, id1);
	expect(store.idMap.size).toBe(0);
});
