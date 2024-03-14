export type ConvertConfig = {
	tabSize: number;

	symbols: {
		strong: "**" | "__";
		em: "*" | "_";
		listMark: "-" | "*" | "+";
		hr:
			| "---"
			| "***"
			| "___"
			| "- - -"
			| "* * *"
			| "_ _ _"
			| "*****"
			| "- - - - -"
			| "* * * * *";
	};
};

export const defaultConvertConfig = (): ConvertConfig => ({
	tabSize: 2,
	symbols: {
		strong: "**",
		em: "*",
		listMark: "-",
		hr: "---",
	},
});
