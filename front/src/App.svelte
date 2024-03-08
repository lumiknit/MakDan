<script lang="ts">
	import { onMount } from "svelte";
	import "./domi";
	import { mountEditor } from "./md";

	let rootDiv: HTMLDivElement;

onMount(() => {
	mountEditor(rootDiv);
});
</script>

<div class="container">
	<div class="md-root" bind:this={rootDiv} />
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
	}
	div.md-root {
		border: 1px solid #ccc;
		min-height: 1rem;
		padding: 1rem;
	}
</style>
