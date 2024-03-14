import { marked } from "marked";
import "./init-marked";
import type { TokensListWithFrontMatter } from "./helpers";

export const md2ast = (md: string): TokensListWithFrontMatter => {
	// Check if the markdown starts with a front matter
	let frontMatter: string | undefined;
	const frontMatterMatch = md.match(/^---\n(.*?)\n---\n/);
	if (frontMatterMatch) {
		md = md.slice(frontMatterMatch[0].length);
		frontMatter = frontMatterMatch[1];
	}
	const ast: TokensListWithFrontMatter = marked.lexer(md);
	ast.frontMatter = frontMatter;
	return ast;
};
