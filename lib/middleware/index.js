const url = require('url');
const util = require('util');

let config = null;
let chain = [];

// setup simple thenable chain of promises
const use = (fn) => {
	chain.push(fn);
};

const init = (obj) => {
	config = obj;

	use(require('./stat'));
	use(require('./cross-origin.js'));
	use(require('./directory.js'));
	use(require('./respond.js'));
};

// log the request
const log = (err, request, response) => {
	if (request.options.nolog === true) {
		return;
	}

	console.log(
		'%s %j - %j - %s',
		request.connection.remoteAddress,
		new Date(),
		util.format('%s %s HTTP/%s %s',request.method, unescape(url.parse(request.url).path), request.httpVersion, response.statusCode),
		request.headers['user-agent']);

	if (err) {
		console.error(err);
	}
};

exports.request = (request, response) => {
	request.options = Object.assign({}, config);

	request.options.uri = unescape(url.parse(request.url).pathname);

	let increment = -1;
	let count = chain.length - 1;

	let req = () => {
		increment++;
		chain[increment](request, response)
		.then((success) => {
			// extend options
			if (typeof success === 'object') {
				Object.assign(request.options, success);
			}

			if (increment < count) {
				req();
			}
			else {
				log(null, request, response);
			}
		})
		.catch((err) => {
			log(err, request, response);

			if (!response.statusCode) {
				response.statusCode = 500;
			}

			response.write(err.message || 'Error');
			response.end();
		});
	};

	req();
};

exports.use = use;
exports.init = init;
