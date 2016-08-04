'use strict';

module.exports = (request, response, next) => {
	var keys = Object.keys(request.headers);
	var accessControlHeader = '';
	keys.forEach((key) => {
		if (key.toLowerCase() == 'access-control-request-headers') {
			accessControlHeader = request.headers[key];
		}
	});

	response.setHeader("Access-Control-Allow-Origin", "*");
	response.setHeader("Access-Control-Allow-Headers", accessControlHeader);
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
	response.setHeader('Access-Control-Allow-Credentials', false);

	next();
};