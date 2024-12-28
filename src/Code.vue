<script setup lang="ts">
import { get, set } from '@vueuse/core';

import { createHighlighterCore } from 'shiki/core';
import githubLightTheme from 'shiki/themes/github-light.mjs';
import githubDarkTheme from 'shiki/themes/github-dark.mjs';
import nixLang from 'shiki/langs/nix.mjs';

import { jsonToNix } from './lib';

const isDarkTheme = useDark();

const input = useStorage('input', JSON.stringify({ a: true, b: 1, c: 'foo' }));
const converted = ref('');
const output = ref('');

const highlighter = await createHighlighterCore({
	themes: [githubLightTheme, githubDarkTheme],
	langs: [nixLang],
	loadWasm: () => import('shiki/wasm'),
});

const copied = ref(false);
const clipboard = useClipboard();

async function run() {
	try {
		const nixified = jsonToNix(get(input));
		set(converted, nixified);

		set(
			output,
			highlighter.codeToHtml(get(converted), {
				lang: 'nix',
				theme: get(isDarkTheme) ? 'github-dark' : 'github-light',
			}),
		);
	} catch (e) {
		set(output, `<span style="color: red;">${(e as Error).message}</span>`);
	}
}

function copy() {
	if (get(converted).length === 0) return;
	clipboard.copy(get(converted));
	set(copied, true);
	setTimeout(() => {
		set(copied, false);
	}, 1000);
}

watch(
	[input, isDarkTheme],
	(n, o) => {
		const changed = o !== n;
		if (changed) run();
	},
	{ immediate: true },
);

if (import.meta.hot) {
	import.meta.hot.accept(() => {
		run();
	});
}
</script>

<template>
	<div flex="~ col md:row gap-4" font-mono p4>
		<textarea
			v-model="input"
			border="~ base rounded"
			placeholder="JSON..."
			px3
			py1
			:class="`${
				isDarkTheme ? 'bg-[#24292F] ' : ''
			}w-full md:w-[50vw] h-[40vh] md:h-[70vh]`"
			spellcheck="false"
			autocorrect="off"
			autocapitalize="off"
		/>
		<div
			border="~ base rounded"
			px3
			py1
			relative
			of-auto
			:class="`${
				isDarkTheme ? 'bg-[#24292F] ' : ''
			}w-full md:w-[50vw] h-[40vh] md:h-[70vh]`"
		>
			<button
				border="~ base rounded"
				p2
				absolute
				top-2
				right-2
				:class="
					converted.length > 0
						? 'hover:bg-active'
						: 'op-[0.5] cursor-not-allowed'
				"
				:aria-disabled="converted.length === 0"
				title="Copy"
				@click="copy()"
			>
				<div v-if="copied" i-carbon-checkmark />
				<div v-else i-carbon-copy />
			</button>
			<div v-html="output" />
		</div>
	</div>
</template>
