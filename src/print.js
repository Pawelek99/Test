const sh = require('shelljs');
require('./utils');

const RED = { code: new RegExp('#r ?(.*?) ?r#', 'g'), value: '31' };
const GREEN = { code: new RegExp('#g ?(.*?) ?g#', 'g'), value: '32' };
const YELLOW = { code: new RegExp('#y ?(.*?) ?y#', 'g'), value: '33' };
const BLUE = { code: new RegExp('#b ?(.*?) ?b#', 'g'), value: '34' };
const MAGENTA = { code: new RegExp('#m ?(.*?) ?m#', 'g'), value: '35' };
const SKY_BLUE = { code: new RegExp('#s ?(.*?) ?s#', 'g'), value: '36' };
const WHITE = { code: new RegExp('#w ?(.*?) ?w#', 'g'), value: '37' };

const NORMAL = { code: new RegExp('## ?(.*?) ?##', 'g'), value: '0' };
const BOLD = { code: new RegExp('\\*\\* ?(.*?) ?\\*\\*', 'g'), value: '1' };
const SOFT = { code: new RegExp('^ ?(.*?) ?^', 'g'), value: '2' };
const ITALIC = { code: new RegExp('\\* ?(.*?) ?\\*', 'g'), value: '3' };
const UNDERSCORE = { code: new RegExp('__ ?(.*?) ?__', 'g'), value: '4' };

const options = [
	RED,
	GREEN,
	YELLOW,
	BLUE,
	MAGENTA,
	SKY_BLUE,
	WHITE,
	NORMAL,
	BOLD,
	SOFT,
	ITALIC,
	UNDERSCORE,
]

// const error = (text) => {
//   formatted(`#r${text}\033[0m`);
// };

// const warning = (text) => {
//   formatted(`#o${text}\033[0m`);
// };

// const tip = (text) => {
//   formatted(`#g${text}\033[0m`);
// };

const formatted = (text) => {
	
	options.forEach((option) => {
		text = text.replace(option.code, (substring, args) => {
			return ('\033[' + option.value + 'm' + args + '\033[0m').replace('[', ' ');
		});
	});

	// Don't forget to reset text color
	sh.echo(text);
}

formatted('Nic #rTur# #b __**n#m i m#e**__ b# ma');