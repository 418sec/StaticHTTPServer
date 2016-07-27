const http = require("http");
const fs = require("fs");
const url = require('url');
const path = require('path');
const util = require('util');
const configuration = require('./config');

const config = configuration.get();
const contentDirectory = config.directory || __dirname;

//known file types.  All others will be served as text/plain
const mimeTypesByExtension = {
	"html": "text/html",
	"jpg": "image/jpeg",
	"jpeg": "image/jpeg",
	"png": "image/png",
	"gif": "image/gif",
	"js": "application/javascript",
	"json": "application/json",
	"css": "text/css"
};

//log the request
function log(request, response) {
	console.log(
		'%s %j - %j - %s',
		request.connection.remoteAddress,
		new Date(),
		util.format('%s %s HTTP/%s', request.method, unescape(url.parse(request.url).path), request.httpVersion),
		request.headers['user-agent']);
}

//send a plain text response
function sendTextResponse(request, response, statusCode, text) {
	response.statusCode = statusCode;
	response.setHeader("Content-Type", "text/plain; charset=utf-8");
	response.write(statusCode + ": " + text);
	response.end();
	log(request, response);
}

//send a directory list
function directoryList(request, response, filePath) {
	fs.readdir(filePath, (err, items) => {
		const displayPath = unescape(url.parse(request.url).path);
		var title = 'Index of "' + displayPath + '"';
		var itemsHtml = [];
		var relativePath = filePath.slice(contentDirectory.length);

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

		response.statusCode = 200;
		response.setHeader("Content-Type", "text/html; charset=utf-8");
		response.write(html);
		response.end();
		log(request, response);
	});
}

if (config.help === true) {
	const helpText = configuration.getHelp();
	console.log(helpText.join('\n'));
	return;
}

var server = http
	.createServer((request, response) => {
		//get the url and handle special characters
		const uri = unescape(url.parse(request.url).path);

		//don't reply with this script
		if (uri == '/index.js' && contentDirectory == __dirname) {
			return sendTextResponse(request, response, 403, "Forbidden");
		}

		//get the filename only
		const filename = path.basename(uri);

		//get the extension
		const extension = path.extname(uri).split('.').reverse()[0];

		//is the file one of the known mime types?
		const mimeType = mimeTypesByExtension[extension.toLowerCase()] || 'text/plain';

		//get the full path to the file on the local file system.
		const filePath = path.join(contentDirectory, uri);

		//does the file exist and is it readible?
		fs.access(filePath, fs.R_OK, (err) => {
			//the file does not exist or is not readible
			if (err) {
				return sendTextResponse(request, response, 404, "Not Found");
			}

			fs.lstat(filePath, (err, stats) => {
				if (stats.isDirectory()) {
					if (config.list === true) {
						return directoryList(request, response, filePath);
					}
					else {
						return sendTextResponse(request, response, 403, "Forbidden");
					}
				}

				//send the file
				response.statusCode = 200;
				response.setHeader("Content-Type", mimeType);

				//cors
				/*
				response.setHeader('Access-Control-Allow-Origin', request.headers.origin || "*");
				response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
				response.setHeader('Access-Control-Allow-Headers', 'x-test,X-Requested-With,content-type');
				response.setHeader('Access-Control-Allow-Credentials', true);
				*/

				fs.createReadStream(filePath).pipe(response);
				log(request, response);
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

//listen for exit
process.stdin
	.setEncoding('utf8')
	.on('readable', () => {
		var chunk = process.stdin.read();
		if (chunk != null) {
			if (chunk.toString().indexOf('exit') == 0) {

				// todo: if used in production this is less than ideal
				// todo: close all sockets and call server.close();
				process.exit(0);
			}
		}
	});
