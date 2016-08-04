'use strict';

const http = require('http');
const fs = require("fs");
const url = require('url');
const path = require('path');
const util = require('util');
const configuration = require('./config');
const crossOrigin = require('./cross-origin');

const config = configuration.get();
const contentDirectory = config.directory || __dirname;
const modulePath = process.mainModule.filename;
let faviconPath = path.dirname(modulePath);

//known file types.  All others will be served as text/plain
const mimeTypesByExtension = {
	"html": "text/html",
	"jpg": "image/jpeg",
	"jpeg": "image/jpeg",
	"png": "image/png",
	"gif": "image/gif",
	"ico": "image/ico",
	"js": "application/javascript",
	"json": "application/json",
	"css": "text/css"
};

const allowedHTTPMethods = ['GET', 'POST', 'OPTIONS', 'HEAD'];

if (faviconPath.substr(faviconPath.length - 3) == 'lib') {
	faviconPath = path.join(faviconPath, 'favicon.ico');
}
else {
	faviconPath = path.join(faviconPath, 'lib', 'favicon.ico');
}

//log the request
function log(options) {

	console.log(
		'%s %j - %j - %s',
		options.request.connection.remoteAddress,
		new Date(),
		util.format('%s %s HTTP/%s %s', options.request.method, unescape(url.parse(options.request.url).path), options.request.httpVersion, options.response.statusCode),
		options.request.headers['user-agent']);

	if (options.err) {
		console.log(options.err);
	}
}

var responseHeaders = (options, next) => {
	crossOrigin(options.request, options.response, (err) => {
		if (err) {
			options.err = err;
			options.statusCode = 501;
		}
		else if (!options.statusCode) {
			options.statusCode = 200;
		}

		//error headers
		if (['4','5'].indexOf(options.statusCode.toString().slice(0,1)) > -1) {
			options.response.statusCode = options.statusCode;
			options.response.setHeader("Content-Type", "text/plain; charset=utf-8");
		}
		else {
			options.response.statusCode = options.statusCode || 200;
			options.response.setHeader("Content-Type", options.mimeType || "text/plain; charset=utf-8");
		}
		next();
	});
};

var directoryList = (options, callback) => {
	fs.readdir(options.filePath, (err, items) => {
		const displayPath = unescape(url.parse(options.request.url).path);
		var title = 'Index of "' + displayPath + '"';
		var itemsHtml = [];
		var relativePath = options.filePath.slice(contentDirectory != './' ? contentDirectory.length : 0);

		if (relativePath.indexOf('/') != 0) {
			relativePath = '/' + relativePath;
		}
		itemsHtml.push('			<li><a href="../">../</a></li>');
		items.forEach(function (item) {
			itemsHtml.push('			<li><a href="' + path.join(relativePath, encodeURIComponent(item)) + '">' + item + '</a></li>');
		});

		const html = '<!DOCTYPE html>\n' +
			'<html>\n' +
			'	<head>\n' +
			'		<title>' + title + '</title>\n' +
			'	</head>\n' +
			'	<body>\n' +
			'		<h1>' + title + '</h1>\n' +
			'		<ul>\n' +
			itemsHtml.join('\n') +
			'		</ul>\n' +
			'	</body>\n' +
			'</html>';

		callback(null, html);
	});
};

var respond = (options) => {
	if (options.err && !options.statusCode) {
		options.statusCode = 501;
		options.text = 'Error';
	}

	if (allowedHTTPMethods.indexOf(options.request.method) == -1) {
		options.statusCode = 403;
		options.text = "Forbidden";
	}

	responseHeaders(options, () => {
		// send error body
		if (['4','5'].indexOf(options.statusCode.toString().slice(0,1)) > -1) {
			options.response.write(options.statusCode + ": " + (options.text || 'Error'));
			options.response.end();
		}
		//send file
		else if (options.request.method == 'HEAD') {
			options.response.end();
		}
		//pipe file or text
		else {
			if (options.html) {
				options.response.write(options.html);
			}
			else {
				fs.createReadStream(options.filePath).pipe(options.response);
			}
		}

		log(options);
	});
}

var listen = () => {
	var server = http
	.createServer((request, response) => {
		let responseOptions = {
			request: request,
			response: response
		};

		//get the url and handle special characters
		const uri = unescape(url.parse(request.url).pathname);

		//don't reply with this script
		if (uri == '/index.js' && contentDirectory == __dirname) {
			responseOptions.statusCode = 403;
			responseOptions.text = "Forbidden";
			return respond(responseOptions);
		}

		//get the filename only
		const filename = path.basename(uri);

		//get the extension
		const extension = path.extname(uri).split('.').reverse()[0];

		//is the file one of the known mime types?
		const mimeType = mimeTypesByExtension[extension.toLowerCase()] || 'text/plain';

		//get the full path to the file on the local file system.
		let filePath = path.join(contentDirectory, uri);

		responseOptions.filePath = filePath;
		responseOptions.filename = filename;
		responseOptions.mimeType = mimeType;

		//does the file exist and is it readible?
		fs.access(filePath, fs.R_OK, (err) => {
			//the file does not exist or is not readible
			if (err) {
				// use the default favicon if one does not exist
				if (uri == '/favicon.ico') {
					responseOptions.filePath = filePath = faviconPath;
				}
				else {
					responseOptions.err = err;
					responseOptions.statusCode = 404;
					responseOptions.text = "Not Found";
					return respond(responseOptions);
				}
			}

			fs.lstat(filePath, (err, stats) => {
				if (stats.isDirectory()) {
					responseOptions.stats = stats;

					if (config.list === true) {
						return directoryList(responseOptions, (err, indexHTML) => {
							responseOptions.mimeType = 'text/html';
							responseOptions.html = indexHTML;
							respond(responseOptions);
						});
					}
					else {
						responseOptions.statusCode = 403;
						responseOptions.text = "Forbidden";
						return respond(responseOptions);
					}
				}

				respond(responseOptions);
			});
		});
	})
	.on('error', (err) => {
		throw err;
	});

	server
		.listen(config.port, config.ip, () => {
			if (config.errors.length > 0) {
				config.errors.forEach( (message) => {
					console.log(message);
				});
			}

			console.log('For options: StaticHTTPServer -h');
			console.log('');
			console.log('content directory: %j', contentDirectory);
			console.log('');
			console.log('Server is now listening...');
			console.log('http://%s:%s/', config.ip, config.port);
			console.log('');
			console.log('exit or ^C to exit');
		});
};

exports.helpText = config.help ? configuration.getHelp().join('\n') : '';
exports.listen = listen;
