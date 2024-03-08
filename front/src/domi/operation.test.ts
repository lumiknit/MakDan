import { expect, test } from "vitest";

import * as operation from "./operation";

test("initHistory", () => {
	const history = operation.initHistory({});
	expect(history.futBatches.length).toBe(0);
	expect(history.pastBatches.length).toBe(1);

	expect(operation.getHistorySize(history)).toBe(1);
});

const testMergeOpUpdateText = (
	name: string,
	prevOffset: number,
	prevBefore: string,
	prevAfter: string,
	nextOffset: number,
	nextBefore: string,
	nextAfter: string,
	expected: boolean,
	expectedOffset?: number,
	expectedBefore?: string,
	expectedAfter?: string,
): void => {
	test(name, () => {
		const prev: operation.OpUpdateText = {
			type: operation.OpType.UpdateText,
			nodeID: 0,
			offset: prevOffset,
			before: prevBefore,
			after: prevAfter,
		};
		const next: operation.OpUpdateText = {
			type: operation.OpType.UpdateText,
			nodeID: 0,
			offset: nextOffset,
			before: nextBefore,
			after: nextAfter,
		};
		const merged = operation._test.mergeOpUpdateTextToPrev(prev, next);
		expect(merged).toBe(expected);
		if (merged) {
			expect(prev.offset).toBe(expectedOffset);
			expect(prev.before).toBe(expectedBefore);
			expect(prev.after).toBe(expectedAfter);
		}
	});
};

testMergeOpUpdateText(
	"merge 1 - Replace first",
	3,
	"hello",
	"world",
	3,
	"wor",
	"test",
	true,
	3,
	"hello",
	"testld",
);

testMergeOpUpdateText(
	"merge 2 - Replace whole and extra",
	3,
	"hello",
	"world",
	1,
	"coworldy",
	"=",
	true,
	1,
	"cohelloy",
	"=",
);

testMergeOpUpdateText(
	"merge 3 - replace Last",
	3,
	"hello",
	"world",
	6,
	"ld",
	"TEST",
	true,
	3,
	"hello",
	"worTEST",
);

testMergeOpUpdateText(
	"merge 4 - replace Last with extra",
	3,
	"hello",
	"world",
	6,
	"ldxy",
	"TEST",
	true,
	3,
	"helloxy",
	"worTEST",
);

testMergeOpUpdateText(
	"merge 5 - Concat before",
	10,
	"hello",
	"world",
	5,
	"12345",
	"JUST ",
	true,
	5,
	"12345hello",
	"JUST world",
);

testMergeOpUpdateText(
	"merge 6 - Concat after",
	10,
	"hello",
	"world",
	15,
	"12345",
	" JUST",
	true,
	10,
	"hello12345",
	"world JUST",
);

testMergeOpUpdateText(
	"merge fail - out bound",
	10,
	"hello",
	"world",
	4,
	"12345",
	" JUST",
	false,
);

testMergeOpUpdateText(
	"merge fail - out bound",
	10,
	"hello",
	"world",
	16,
	"12345",
	" JUST",
	false,
);
