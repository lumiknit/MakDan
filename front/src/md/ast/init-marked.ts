import { marked, type TokensList } from "marked";
import markedKatex from "marked-katex-extension";

marked.setOptions({
	breaks: false,
	gfm: true,
});

// Initialize marked with KaTeX support

marked.use(
	markedKatex({
		throwOnError: false,
	}),
);
