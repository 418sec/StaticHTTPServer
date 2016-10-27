
const fs = require('fs');

module.exports = (request, response) => {
	return new Promise( (resolve) => {
		let options = request.options;

		if (options.headers) {
			Object.keys(options.headers).forEach((key) => {
				response.setHeader(key, options.headers[key]);
			});
		}

		if (options.mimeType) {
			response.setHeader('content-type', options.mimeType);
		}

		if (request.method == 'HEAD') {
			return response.end();
		}

		// pipe file or text
		if (options.html || options.text) {
			response.write(options.html || options.text);
			response.end();
		}
		else {
			fs.createReadStream(options.filePath).pipe(response);
		}

		resolve();
	});
};
