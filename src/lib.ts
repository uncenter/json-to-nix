import {
	type ArrayNode,
	type ObjectNode,
	type Token,
	type ValueNode,
	parse,
} from '@humanwhocodes/momoa';

function getIndent(opts: IndentOptions): string {
	return opts.string.repeat(opts.level);
}

function stringToNix(str: string): string {
	let escaped = str.replace('"', '\\"').replace('$', '\\$');
	return `"${escaped}"`;
}

function valueToNix(
	val: ValueNode,
	iopts: IndentOptions,
	gopts: GeneralOptions,
): string {
	switch (val.type) {
		case 'Object':
			return objectToNix(val, iopts, gopts);
		case 'Array':
			return arrayToNix(val, iopts, gopts);
		case 'String':
			return stringToNix(val.value);
		case 'Number':
		case 'Boolean':
			return val.value.toString();
		case 'Null':
		case 'NaN':
		case 'Infinity':
			return 'null';
	}
}

// TODO: Implement flattening of objects with a single key.
// { foo: { bar: true } } -> { foo.bar = true; }
// { foo: { bar: true, baz: false } } -> { foo = { bar = true; baz = false; }; }
function objectToNix(
	obj: ObjectNode,
	iopts: IndentOptions,
	gopts: GeneralOptions,
): string {
	if (obj.members.length === 0) return '{}';

	let result = '{\n';
	iopts.level++;
	for (const member of obj.members) {
		let value = valueToNix(member.value, iopts, gopts);
		let key;
		switch (member.name.type) {
			case 'String':
				key = member.name.value;
				break;
			case 'Identifier':
				key = member.name.name;
				break;
		}
		// https://nix.dev/manual/nix/2.18/language/values.html#attribute-set
		key = /^[a-zA-Z0-9_'-]*$/.test(key) ? key : stringToNix(key);
		result += `${getIndent(iopts)}${key} = ${value};\n`;
	}
	iopts.level--;
	result += `${getIndent(iopts)}}`;
	return result;
}

function arrayToNix(
	arr: ArrayNode,
	iopts: IndentOptions,
	gopts: GeneralOptions,
): string {
	if (arr.elements.length === 0) return '[]';

	let result = '[\n';
	iopts.level++;
	for (const element of arr.elements) {
		let value = valueToNix(element.value, iopts, gopts);
		result += `${getIndent(iopts)}${value}\n`;
	}
	iopts.level--;
	result += `${getIndent(iopts)}]`;
	return result;
}

export function jsonToNix(json: string): string {
	const { body, tokens } = parse(json, {
		mode: 'jsonc',
		allowTrailingCommas: true,
		tokens: true,
	});
	if (body.type !== 'Object')
		throw new Error('Expected JSON document to be an object');
	const comments = gatherComments(json, tokens!);
	console.log(comments);
	console.log(body);
	return objectToNix(
		body,
		{ level: 0, string: '  ' },
		{
			comments,
		},
	);
}

function gatherComments(source: string, tokens: Token[]): CommentToken[] {
	let comments = [];
	for (const token of tokens) {
		if (token.type === 'LineComment' || token.type === 'BlockComment') {
			let type = token.type === 'LineComment' ? 'Line' : 'Block';
			let value = source.slice(
				token.loc.start.offset,
				token.loc.end.offset,
			);
			if (type === 'Block') {
				value = value.slice(2, -2);
			} else {
				value = value.slice(2);
			}
			comments.push({
				...token,
				type,
				value,
			} as CommentToken);
		}
	}
	return comments;
}

type CommentToken = Token & {
	type: 'Line' | 'Block';
	value: string;
};

type IndentOptions = {
	level: number;
	string: string;
};

type GeneralOptions = {
	comments: CommentToken[];
};
