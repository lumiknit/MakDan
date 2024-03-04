<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { type Context, installContext, uninstallContext } from "./context";

	let rootRef: HTMLDivElement;
	let context: Context;

	onMount(() => {
		context = installContext(rootRef);
	});

	onDestroy(() => {
		uninstallContext(context);
	});
</script>

<div class="md-root" contenteditable="true" bind:this={rootRef} />

<style lang="scss">
	div.md-root {
		&:focus {
			outline: none;
			border: none;
		}
	}
</style>
