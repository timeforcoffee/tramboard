'use strict';

var tramServices = angular.module('tramServices', ['ngResource', 'LocalStorageModule']);
 
// service to get the station board from opendata.ch
tramServices.factory('Tram', ['$resource',

  function($resource) {
    return $resource('http://transport.opendata.ch/v1/stationboard?station=:station', {}, {
      query: {method:'GET', params:{station:'station'}, responseType: 'json', isArray:true, transformResponse: function(data, headers){
        return _.map(data.stationboard, function(entry){
          var response = {
            departure: new Date(entry.stop.departure),
            to: entry.to.replace("Z\u00FCrich, ", ""),
            number: entry.number
          }
          return response;
        });
      }}
    });
  }

]);

// service to save and get the stuff from the local storage
tramServices.factory('storage', ['localStorageService',
  // service to read and write configuration

  function(localStorageService) {

    var config = [
      {
        station: 'Hirschwiesenstrasse',
        groups: [
          {
            contains: ['bahnhofplatz', 'triemli'],
            id: 'hirschi_to_city',
            name: "Hirschi - city"
          },
          {
            contains: ['flughafen', 'seebach', 'oerlikon'],
            id: 'city_to_hirschi',
            name: "City - Hirschi"
          }
        ]
      },
      {
        station: 'Milchbuck',
        groups: [
          {
            contains: ['bahnhofplatz', 'wollishofen', 'triemli', 'heuried'],
            id: 'milchbuck_to_city',
            name: "Milchbuck - city"
          },
          {
            contains: ['morgental'],
            id: 'milchbuck_to_escher',
            name: "Milchbuck - Escher"
          }
        ]
      }
    ];
    
    localStorageService.add('localStorageKey', JSON.stringify(config));

    // variable to hold only a singleton of possibleViews()
    var views = null;

    return {

      possibleViews: function() {
        if (views == null) {
          var result = _.map(config, function(station) {
            return _.map(station.groups, function(group) {
              return {
                id: group.id,
                name: group.name
              }
            })
          })
          views = _.flatten(result);
        }

        console.log("Found views: ", views)
        return views;
      },

      addView: function(view) {
        // todo implement
      },

      stationsToQuery: function() {
        return config;
      }

    }
  }

]);