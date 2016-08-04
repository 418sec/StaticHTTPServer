'use strict';

const util = require('util');
const availableArguments = [
	{ name: 'help', text: 'Display this help', default: false },
	{ name: 'directory', text: 'Content Directory', default: './' },
	{ name: 'port', text: 'Server port', default: '9001' },
	{ name: 'ip', text: 'Server IP Address or Hostname', default: 'localhost' },
	{ name: 'list', text: 'Allow directory list', default: true }
];

function get () {
	const args = process.argv;
	let config = {};
	let definitionMap = {};
	config.errors = [];

	availableArguments.forEach((definition) => {
		definitionMap[definition.name.slice(0,1)] = definition;
		if (definition.default) {
			config[definition.name] = definition.default;
		}
	});

	args.forEach((arg) => {
		if (arg.indexOf('-') != -1) {
			let setting = arg.replace(/^-{1,2}/gi, '').split('=');
			let key = setting[0].slice(0, 1);
			let value = setting.length > 0 ? setting[1] : '';
			let definition = definitionMap[key];

 			if (key == 'h') {
				config.help = true;
				return true;
			}

			if (!definition) {
				config.errors.push(util.format("Error: Unknown command line argument \"%s\"", setting[0]));
			}
			else {
				if (typeof definition.default === 'boolean') {
					value = value === "true";
				}

				if (typeof value == 'undefined') {
					config.errors.push(util.format("Error: Command line argument \"%s\" (\"%s\") requires a value. Example: \n\t StaticHTTPServer --\%s=%s", key, definition.name, definition.name, definition.default));
				}

				config[definition.name] = typeof value != 'undefined' ? value : definition.default;
			}
		}
	});

	return config;
};

function getHelp() {
	let helpText = [];
	helpText.push('Creates a static http file server');
	helpText.push('');
	helpText.push('StaticHTTPServer [--port] [--ip] [--directory] [--list]');
	helpText.push('');
	helpText.push('Argument\t\Default\tDescription');

	availableArguments.forEach((definition) => {
		helpText.push(util.format('%s (%s)\t%s\t%s', definition.name, definition.name.slice(0,1), definition.default, definition.text));
	});
	return helpText;
}

exports.get = get;
exports.getHelp = getHelp;