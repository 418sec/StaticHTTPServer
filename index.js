'use strict';
const staticHTTPServer = require('./lib/statichttpserver');

if (staticHTTPServer.helpText) {
	console.log(staticHTTPServer.helpText);
}
else {
	staticHTTPServer.listen();

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
}
