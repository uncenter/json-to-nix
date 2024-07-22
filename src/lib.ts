export function nixify(value: unknown, level: number = 1): string | undefined {
	const indent = '  '.repeat(level);
	const subindent = '  '.repeat(level - 1);
	if (
		typeof value === 'string' ||
		Number.isInteger(value) ||
		value === null ||
		value === true ||
		value === false
	)
		return `${JSON.stringify(value)}`;
	else if (Array.isArray(value))
		return `[\n${value.map((item) => `${indent}${nixify(item, level + 1)}`).join('\n')}\n${subindent}]`;
	else {
		let nix = '{\n';
		for (const [k, v] of Object.entries(
			value as Record<string, boolean | string | null>,
		)) {
			// https://nix.dev/manual/nix/2.18/language/values.html#attribute-set
			nix += `${indent}${k.match(/^[a-zA-Z0-9_'-]*$/) ? k : `"${k}"`} = ${nixify(v, level + 1)};\n`;
		}
		return nix?.trimEnd() + `\n${subindent}}`;
	}
}
