import { expect, test } from "vitest";

import * as id from "./id";

test("initIDStore", () => {
	const store = id.initIDStore({});
	expect(store.idCnt).toBe(0);
});
