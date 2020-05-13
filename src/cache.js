const gitRootDir = require('git-root-dir');
const sh = require('shelljs');
const fs = require('fs');
const loaded = false;
const cache = new Map();
let path = undefined;

const computePath = async () => {
	if (path) {
		return;
	}

	const git = await gitRootDir();

	if (!git) {
		sh.echo('You can only use this library in the git directory');
		sh.exit(1);
	}

	path = `${git}/.git/.itg.cache`;
};

const loadFile = async () => {
	await computePath();

	// Avoid loading file if it's already loaded
	if (loaded || !fs.existsSync(path)) {
		return;
	}

	loaded = true;

	// Load file contents and treat each line as a 'key:value' pair
	const content = fs.readFileSync(path).toLocaleString();
	content.split('\n').forEach((line) => {
		const pair = line.split(':');
		cache.set(pair[0], pair[1]);
	});
};

const saveFile = async () => {
	await computePath();

	const data = [];

	// Save cache entries to an array as 'key:value' pair and then join them with a newline character
	cache.forEach((value, key) => {
		data.push(`${key}:${JSON.stringify(value)}`);
	});
	fs.writeFileSync(path, data.join('\n'));
};

const get = async (key) => {
	await loadFile();

	return cache.get(key);
};

const set = async (key, value) => {
	cache.set(key, value);

	await	saveFile();
};

const has = async (key) => {
	await loadFile();

	return cache.has(key);
};

module.exports = {
	get,
	set,
	has,
};