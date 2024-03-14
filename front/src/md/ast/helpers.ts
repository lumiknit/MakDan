import type { Marked, TokensList } from "marked";

export type FrontMatter = {
	frontMatter?: string;
};

export type TokensListWithFrontMatter = TokensList & FrontMatter;
