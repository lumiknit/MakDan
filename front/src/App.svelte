<script lang="ts">
	import { onMount } from "svelte";
	import { ast2md, md2ast } from "./md/ast";
	import { defaultConvertConfig } from "./md/ast/conv-config";
	import { marked } from "marked";
	let rootDiv: HTMLDivElement;

	let value: string = "";
	let ast: any = "";
	let output: string = "";

	$: try {
		ast = md2ast(value);
		output = ast2md(defaultConvertConfig(), ast);
	} catch (e) {
		output = "" + e;
	}
</script>

<div class="container">
	<div class="column">
		<textarea bind:value rows="10" />
		<div>
			{@html marked.parse(value)}
		</div>
		<pre>{JSON.stringify(ast, null, 2)}</pre>
	</div>
	<div class="column">
		<pre>{output}</pre>
		<div>
			{@html marked.parse(output)}
		</div>
	</div>
</div>

<style>
	.container {
		max-width: 1024px;
		display: flex;
		flex-direction: row;
		margin: 0 auto;
	}

	.column {
		position: relative;
		flex-grow: 1;
		flex-shrink: 0;
		margin: 1rem;

		& > textarea,
		& > pre {
			width: 100%;
			padding: 1rem;
			border: 1px solid red;
		}
	}

	pre {
		background-color: #f8f8f8;
		border: 1px solid #ccc;
		padding: 1rem;
	}
</style>
