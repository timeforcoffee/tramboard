'use strict'

var Hapi = require('hapi');

var server = new Hapi.Server(+process.env.PORT || 8000, '0.0.0.0');

server.route({
	method: 'GET',
	path: '/bin/{param*}',
	handler: {
		proxy: {
			host: 'online.fahrplan.zvv.ch',
			port: 80,
			protocol: 'http',
			passThrough: true
		}
	}
});

server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: '.'
        }
    }
});

server.start();