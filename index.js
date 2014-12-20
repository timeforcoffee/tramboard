'use strict'

var Hapi   = require('hapi');
var needle = require('needle');
var Joi    = require('joi');
var _      = require('underscore');
var moment = require('moment-timezone');

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
	path: '/stationboard/{station}',
	config: {
		handler: function(request, reply) {
			// '/bin/stboard.exe/dn?L=vs_stbzvv&input=:station&boardType=dep&productsFilter=1:1111111111111111&additionalTime=0&disableEquivs=false&maxJourneys=18&start=yes&monitor=1&requestType=0&view=preview&dirTripelId=L%3d:direction

			var url = '/bin/stboard.exe/dn?L=vs_stbzvv&boardType=dep&productsFilter=1:1111111111111111&additionalTime=0&disableEquivs=false&maxJourneys=18&start=yes&monitor=1&requestType=0&view=preview';
			url += '&input=' + request.params.station;
			if (request.params.direction) {
				url += '&dirTripelId=L%3d' + request.params.direction;
			}

			needle.get('http://online.fahrplan.zvv.ch' + url, function(error, response) {
				if (error) {
					reply(Hapi.error.internal(error));
				}
				else {
					var jsonResponse = JSON.parse(response.body.replace('journeysObj = ', ''));
			        console.log("Parsed response: ", jsonResponse);

			        reply(_.map(jsonResponse.journey, function(entry){
			          var dateItems = entry.da.split('.');

			          var departure = moment.tz('20'+dateItems[2]+'-'+dateItems[1]+'-'+dateItems[0]+' '+entry.rt.dlt, 'Europe/Zurich');
			          var undelayed = moment.tz('20'+dateItems[2]+'-'+dateItems[1]+'-'+dateItems[0]+' '+entry.ti, 'Europe/Zurich');

			          var special = "";
			          var number = entry.pr.replace(/ /g, '');
			          number = number.replace('&nbsp;', '');
			          number = number.replace('Bus', '');

			          if (number.charAt(0) == "N") special = "night";
			          if (number.length >= 3) special += " small";

			          if (!departure || !departure.year()) departure = undelayed;

			          // TODO complete this with all sorts of possible stuff
			          var name
			          switch(entry.productCategory) {
			            case "Trm-NF":
			              name = "NFT " + entry.pr
			              break;
			            case "Trm":
			              name = "T " + entry.pr
			              break;
			            case "Bus":
			              name = number
			            default:
			              name = 'other';
			              break;
			          }

			          var data = {
			            zvv_id: entry.id,
			            departure: departure.format(),
			            undelayed_departure: undelayed.format(),
			            delay_in_minutes: entry.rt.dlm,
			            to: entry.st,
			            number: number,
			            sbb_name: name,
			            special: special
			          }

			          return data;
			        }));
				}
			});

		},
		validate: {
			params: {
				station: Joi.string().length(9)
			}
		}
	}
})

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