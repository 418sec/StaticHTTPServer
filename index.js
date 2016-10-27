'use strict';
const staticHTTPServer = require('./lib');

if (staticHTTPServer.helpText) {
	console.log(staticHTTPServer.helpText);
}
else {
	staticHTTPServer.start();

	//listen for exit
	process.stdin
		.setEncoding('utf8')
		.on('readable', () => {
			var chunk = process.stdin.read();
			if (chunk != null) {
				if (chunk.toString().indexOf('exit') == 0) {
					staticHTTPServer.stop(function (err) {
						process.exit(0);
					});
				}
			}
		});
}
