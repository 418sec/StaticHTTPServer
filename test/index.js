'use strict';

const app = require('../lib');
const request = require('request');
require('chai').should();

const config = {
	nolog: true,
	host: 'localhost',
	port: Math.floor(Math.random() * 1000) + 9000
};

const baseUrl = `http://${config.host}:${config.port}/test/fixtures/`;

describe('integration: routes & verbs', () => {

	it(`server listening on on default ${config.host}:${config.port}`, (done) => {

		app.start(config, (appError) => {
			if (appError) { return done(appError); }

			request(`${baseUrl}/index.html`, (err, res) => {
				if (err) { return done(err); }

				res.statusCode.should.equal(200);
				done();
			});
		});
	});

	it(`server returns content-type header`, (done) => {
		request(`${baseUrl}/index.html`, (err, res) => {
			if (err) { return done(err); }

			res.headers['content-type'].should.equal('text/html');
			done();
		});
	});

	it(`server closed after app.close`, (done) => {
		app.stop((appError) => {
			if (appError) { return done(appError); }

			request(`${baseUrl}/index.html`, { timeout: 500 }, (err) => {
				err.code.should.equal('ECONNREFUSED');
				done();
			});
		});
	});
});
