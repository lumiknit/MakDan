import type { ConvertConfig } from "./conv-config";

import { type Links, type TokensList, type Token } from "marked";
import "./init-marked";
import type { TokensListWithFrontMatter } from "./helpers";

// String buffer

type Lines = string[];

const appendLines = (lines: Lines, ...chunks: (string | Lines)[]): Lines => {
	for (const chunk of chunks) {
		const ls = Array.isArray(chunk) ? chunk : chunk.split("\n");
		lines[lines.length - 1] += ls.shift()!;
		lines.push(...ls);
	}
	return lines;
};

const newLines = (...chunks: (string | Lines)[]): Lines =>
	appendLines([""], ...chunks);

const newTightBlock = (...chunks: (string | Lines)[]): Lines => {
	const lines = newLines(...chunks);
	// Check if only the last line is empty
	while (lines[lines.length - 1] !== "") {
		lines.push("");
	}
	return lines;
};

const newBlock = (...chunks: (string | Lines)[]): Lines => {
	const lines = newLines(...chunks);
	// Check if only the last line is empty
	while (lines[lines.length - 1] !== "" || lines[lines.length - 2] !== "") {
		lines.push("");
	}
	return lines;
};

const indentLines = (
	lines: Lines,
	indent: string,
	firstLineIndet?: string,
): Lines => {
	lines[0] = (firstLineIndet || indent) + lines[0];
	let b = lines.length;
	while (b > 0 && lines[b - 1] === "") b--;
	for (let i = 1; i < b; i++) {
		lines[i] = indent + lines[i];
	}
	return lines;
};

// Create custom renderer, convert to string
type ConfigWithLinks = ConvertConfig & { links: Map<string, string> };

const hrefToString = (o: { href: string; title?: string | null }): string =>
	o.href + (o.title ? ` "${o.title}"` : "");

const wrapInline = (config: ConfigWithLinks, q: string, token: Token): Lines =>
	newLines(q, tokens2lines(config, (token as any).tokens), q);

export const token2lines = (config: ConfigWithLinks, token: Token): Lines => {
	switch (token.type) {
		// DONE
		// - Blocks
		case "paragraph":
			return newBlock(tokens2lines(config, token.tokens!));
		case "blockquote":
			return newBlock(indentLines(tokens2lines(config, token.tokens!), "> "));
		case "heading":
			return newBlock(
				["#".repeat(token.depth) + " "],
				tokens2lines(config, token.tokens!),
			);
		case "code":
			return newBlock("```" + token.lang + "\n", token.text, "\n```");
		case "hr":
			return newBlock(config.symbols.hr);
		case "blockKatex":
			return newBlock("$$\n", token.text, "\n$$");

		// - Lists
		case "list":
			let marker = token.ordered
				? (start: number, i: number) => `${start + i}. `
				: () => `${config.symbols.listMark} `;
			let nb = token.loose ? newBlock : newTightBlock;
			return newBlock(
				...token.items.map((item: Token, idx: number) => {
					if (item.type !== "list_item")
						throw `Unknown token type: ${item.type}`;
					const lines = tokens2lines(config, item.tokens!, true);
					const m = marker(token.start!, idx);
					return nb(
						indentLines(
							lines,
							" ".repeat(m.length),
							m + (item.task ? (item.checked ? "[x] " : "[ ] ") : ""),
						),
					);
				}),
			);

		// - Inlines
		case "escape":
			return newLines("\\", token.text);
		case "em":
			return wrapInline(config, config.symbols.em, token);
		case "strong":
			return wrapInline(config, config.symbols.strong, token);
		case "text":
		case "html":
			return newLines(token.text);
		case "codespan":
			const q = token.text.includes("`") ? "```" : "`";
			return newLines(q, token.text, q);
		case "br":
			return ["", ""];
		case "del":
			return wrapInline(config, "~~", token);
		case "inlineKatex":
			return newLines("$", token.text, "$");
		case "link": {
			const s = hrefToString(token as any);
			return newLines(
				"[",
				tokens2lines(config, token.tokens!),
				"]",
				config.links.has(s) ? `[${config.links.get(s)}]` : `(${s})`,
			);
		}
		case "image": {
			const s = hrefToString(token as any);
			return newLines(
				"![",
				token.text,
				"]",
				config.links.has(s) ? `[${config.links.get(s)}]` : `(${s})`,
			);
		}

		case "space":
			return [""];

		default:
			throw `Unknown token type: ${token.type}`;
	}
};

const tokens2lines = (
	config: ConfigWithLinks,
	tokens: Token[],
	block?: boolean,
): Lines => {
	const lines = newLines();
	for (const token of tokens) {
		let converted = token2lines(config, token);
		if (block) converted = newBlock(converted);
		appendLines(lines, converted);
	}
	return lines;
};

const tokens2md = (config: ConfigWithLinks, tokens: Token[]): string =>
	tokens2lines(config, tokens).join("\n");

const links2md = (config: ConfigWithLinks, links: Links): string =>
	Object.entries(links)
		.map(([key, link]) => {
			const s = hrefToString(link);
			// Add link to map inverse
			config.links.set(s, key);
			// Return link
			return `[${key}]: ${s}`;
		})
		.join("\n");

export const ast2md = (
	config: ConvertConfig,
	ast: TokensListWithFrontMatter,
): string => {
	const cfg = { ...config, links: new Map() };
	// Convert
	const l = links2md(cfg, ast.links);
	const t = tokens2md(cfg, ast);
	const fm = ast.frontMatter ? `---\n${ast.frontMatter}\n---\n` : "";
	return [fm, t, l].filter(x => x).join("\n");
};
