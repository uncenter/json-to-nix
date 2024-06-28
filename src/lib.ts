export function jsonToNix(
	json: unknown,
	level: number = 1,
): string | undefined {
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
		return `[\n${json.map((item) => `${indent}${jsonToNix(item, level + 1)}`).join('\n')}\n${subindent}]`;
	else {
		let nix = '{\n';
		for (const [key, value] of Object.entries(
			json as Record<string, boolean | string | null>,
		)) {
			nix += `${indent}${key.includes(' ') ? `"${key}"` : key} = ${jsonToNix(value, level + 1)};\n`;
		}
		return nix?.trimEnd() + `\n${subindent}}`;
	}
}
