'use strict';

module.exports = (request) => {
	return new Promise((resolve) => {
		if (!request.options.crossorigin) {
			return resolve();
		}

		var accessControlHeader = request.headers['access-control-request-headers'] || '';

		if (!request.options.headers) {
			request.options.headers = {};

		}
		request.options.headers['Access-Control-Allow-Origin'] =  '*';
		request.options.headers['Access-Control-Allow-Headers'] = accessControlHeader;
		request.options.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, HEAD';
		request.options.headers['Access-Control-Allow-Credentials'] = false;

		resolve();
	});
};
