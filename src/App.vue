<script setup lang="ts">
import { get, set } from '@vueuse/core';

import { getHighlighterCore } from 'shiki/core';
import githubLightTheme from 'shiki/themes/github-light.mjs';
import githubDarkTheme from 'shiki/themes/github-dark.mjs';
import nixLang from 'shiki/langs/nix.mjs';

import { destr } from 'destr';

const isDarkTheme = useDark();
const prefersDark = usePreferredDark();

useFavicon(
	computed(() => (get(prefersDark) ? 'favicon-dark.svg' : 'favicon.svg')),
	{
		baseUrl: '/',
		rel: 'icon',
	},
);

const input = useStorage('input', JSON.stringify({ a: true, b: 1, c: 'foo' }));
const converted = ref('');
const output = ref('');

const copied = ref(false);
const clipboard = useClipboard();

function jsonToNix(json: unknown, level: number = 1): string | undefined {
	const indent = '  '.repeat(level);
	const subindent = '  '.repeat(level - 1);
	if (
		typeof json === 'string' ||
		Number.isInteger(json) ||
		json === null ||
		json === true ||
		json === false
	)
		return `${JSON.stringify(json)}`;
	else if (Array.isArray(json))
		return `[\n${json.map((item) => `${indent}${jsonToNix(item)}`).join('\n')}\n${subindent}]`;
	else {
		let nix = '{\n';
		for (const [key, value] of Object.entries(
			json as Record<string, boolean | string | null>,
		)) {
			nix += `${indent}${key} = ${jsonToNix(value, level + 1)};\n`;
		}
		return nix?.trimEnd() + `\n${subindent}}`;
	}
}

async function run() {
	set(converted, jsonToNix(destr(get(input) || null)));
	const highlighter = await getHighlighterCore({
		themes: [githubLightTheme, githubDarkTheme],
		langs: [nixLang],
		loadWasm: () => import('shiki/wasm'),
	});

	set(
		output,
		highlighter.codeToHtml(get(converted), {
			lang: 'nix',
			theme: get(isDarkTheme) ? 'github-dark' : 'github-light',
		}),
	);
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
	<div h-100vh w-full px4 pt-4>
		<header flex="~ justify-between">
			<h1 class="text-xl">JSON to Nix</h1>

			<div flex="~ row gap-2">
				<a
					border="~ base rounded"
					p2
					hover="bg-active"
					aria-label="GitHub repository"
					href="https://github.com/uncenter/json-to-nix"
				>
					<div i-carbon-logo-github />
				</a>
				<button
					border="~ base rounded"
					p2
					hover="bg-active"
					:aria-label="`Toggle theme to ${isDarkTheme ? 'light' : 'dark'}`"
					@click="isDarkTheme = !isDarkTheme"
				>
					<div dark:i-carbon-moon i-carbon-sun />
				</button>
			</div>
		</header>
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
	</div>
</template>

<style>
:root {
	color-scheme: light;
}

:root.dark {
	color-scheme: dark;
}
</style>
