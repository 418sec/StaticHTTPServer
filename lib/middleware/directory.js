const fs = require('fs');
const url = require('url');
const path = require('path');

module.exports = (request) => {
	return new Promise( (resolve, reject) => {
		let options = request.options;
		if (!options.dlist) {
			return resolve();
		}

		fs.readdir(options.filePath, (readError, items) => {
			if (readError) { return reject(readError); }

			const displayPath = unescape(url.parse(request.options.uri).path);
			var title = `Index of "${displayPath}"`;
			var itemsHtml = [];
			var relativePath = options.filePath.slice(options.directory != './' ? options.directory.length : 0);

			if (relativePath.indexOf('/') != 0) {
				relativePath = `/${relativePath}`;
			}
			itemsHtml.push('			<li><a href="../">../</a></li>');
			items.forEach(function (item) {
				itemsHtml.push(`			<li><a href="${path.join(relativePath, encodeURIComponent(item))}">${item}</a></li>`);
			});

			const html = `<!DOCTYPE html>\n
				<html>\n
					<head>\n
						<title>${title}</title>\n
					</head>\n
					<body>\n
						<h1>${title}</h1>\n
						<ul>\n
							${itemsHtml.join('\n')}
						</ul>\n
					</body>\n
				</html>`;

			return resolve({
				html
			});
		});
	});
};
