<script setup lang="ts">
import { get } from '@vueuse/core';

import Code from './Code.vue';

const isDarkTheme = useDark();
const prefersDark = usePreferredDark();

useFavicon(
	computed(() => (get(prefersDark) ? 'favicon-dark.svg' : 'favicon.svg')),
	{
		baseUrl: '/',
		rel: 'icon',
	},
);
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
		<Suspense>
			<Code />
		</Suspense>
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
