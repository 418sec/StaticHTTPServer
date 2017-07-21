'use strict';

const http = require('http');
const path = require('path');

const configuration = require('./config');

let config = configuration.get();
config.directory = config.directory || __dirname;

var middleware = require('./middleware');
middleware.init(config);

let server = null;
let listener = null;
let activeConnections = {};

var listen = (options, callback) => {
	if (options) {
		config = Object.assign(config, options);
	}

	server = http
		.createServer(middleware.request)
		.on('error', (err) => {
			throw err;
		});

	listener = server.listen(config.port, config.ip, () => {
		if (config.errors.length > 0) {
			config.errors.forEach( (message) => {
				console.log(message);
			});
		}

		if (config.nolog !== true) {
			console.log(`For options: StaticHTTPServer -h

${config.package.name} (v${config.package.version}) is now listening on ${config.ip}:${config.port}...

content directory: ${config.directory}
http://${config.ip}:${config.port}/

exit or ^C to exit`);
		}

		callback && callback();
	});

	server.on('connection', (connection) => {
		var key = Math.random().toString(16).slice(2);
		activeConnections[key] = connection;
	});

	server.on('close', () => {
		for (var key in activeConnections) {
			if (activeConnections[key]) {
				activeConnections[key].destroy();
			}
		}
	});
};

var stop = (cb) => {
	server.emit('close');
	listener.close(cb);
};

exports.helpText = config.help ? configuration.getHelp().join('\n') : '';
exports.start = listen;
exports.stop = stop;
