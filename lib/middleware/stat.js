const fs = require('fs');
const path = require('path');
const mimeTypes = require('./mime-types');

module.exports =
	function (request, response) {
		return new Promise( (resolve, reject) => {
			let uri = request.options.uri;

			// get the filename only
			const filename = path.basename(uri);

			// get the extension
			const extension = path.extname(uri)
				.split('.')
				.reverse()[0];

			// is the file one of the known mime types?
			const mimeType = mimeTypes[extension.toLowerCase()] || 'text/plain';

			// get the full path to the file on the local file system.
			let filePath = path.join(request.options.directory, uri);

			// does the file exist and is it readible?
			fs.access(filePath, fs.R_OK, (accessError) => {
				// the file does not exist or is not readible
				if (accessError) {
					// use the default favicon if one does not exist
					if (uri == '/favicon.ico') {
						return resolve({
							filename,
							mimeType,
							filePath: request.options.faviconPath
						});
					}

					response.statusCode = 404;
					return reject(new Error('Not Found'));
				}

				fs.lstat(filePath, (err, stats) => {
					if (err) { return reject(err); }

					if (stats.isDirectory()) {
						if (!request.options.list) {
							response.statusCode = 403;
							return reject(new Error('Forbidden'));
						}

						return resolve({
							filePath,
							dlist: true,
							stats
						});
					}

					return resolve({
							filename,
							mimeType,
							filePath
						});
				});
			});
		}
	);
}
