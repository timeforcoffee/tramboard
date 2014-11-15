'use strict';

var tramServices = angular.module('tramServices', ['ngResource', 'LocalStorageModule']);
 
// service to get the station board from opendata.ch
tramServices.factory('Tram', ['$resource',

  function($resource) {
    return $resource('', {}, {
      queryStation: {method:'GET', url:'/stationboard/:station', params:{station:'station'}, isArray: true, responseType: 'json', transformResponse: function(data, headers){
        var now = Date.now();

        return _.map(data, function(item) {
            item.departure = moment(item.departure);
            item.undelayed_departure = moment(item.undelayed_departure);

            var in_seconds = (item.departure - now) / 1000;
            item.in_minutes = Math.floor(in_seconds / 60) % 60;
            item.in_hours = Math.floor(Math.floor(in_seconds / 60) / 60);

            // TODO make a better logic here
            item.nice_to = item.to.replace("Z\u00FCrich, ", "")
            return item;
        });
      }},

      queryOpenTransport: {method:'GET', url: '//transport.opendata.ch/v1/stationboard?station=:station', params:{station:'station'}, responseType: 'json', isArray:true, transformResponse: function(data, headers){
        return _.map(data.stationboard, function(entry){
          var response = {
            departure: new Date(entry.stop.departure),
            undelayed: new Date(entry.stop.departure),
            to: entry.to.replace("Z\u00FCrich, ", ""),
            number: entry.number
          }
          return response;
        });
      }},

      autocomplete: {method:'GET', url:'//transport.opendata.ch/v1/locations?query=:query&type=station', params:{query:'query'}, responseType: 'json', isArray: false}
    });
  }

]);

// service to save and get the stuff from the local storage
tramServices.factory('storage', ['localStorageService', 'Tram',
  // service to read and write configuration

  /**
   * [
      {
        "name": "Hirschi - City",
        "station": {
          "name": "Zürich, Hirschwiesenstrasse",
          "id": "008591193"
        },
        "keywords": "bahnhofplatz, triemli",
        "id": "59C96004-AD8F-5910-8954-F58CD5B34D61"
      },
      {
        "name": "City - Hirschi",
        "station": {
          "name": "Zürich, Hirschwiesenstrasse",
          "id": "008591193"
        },
        "keywords": "flughafen, seebach, oerlikon",
        "id": "5FFBCFA4-7EF4-56C4-BC35-651CF04E0874"
      },
      {
        "name": "Milchbuck",
        "station": {
          "name": "Zürich, Milchbuck",
          "id": "008591276"
        },
        "id": "6464B340-4C38-56DA-84F8-6DE530830FF3"
      },
      {
        "name": "HB - Basel",
        "station": {
          "name": "Zürich HB",
          "id": "008503000"
        },
        "id": "6E91C6F7-0DA3-5785-9064-AF819D91AD50",
        "keywords": "basel"
      },
      {
        "name": "Bassecourt",
        "station": {
          "name": "Bassecourt",
          "id": "008500122"
        },
        "id": "41F39077-A369-5BA2-8E53-1F8E91993303",
        "keywords": ""
      }
    ]
   *
   */

  function(localStorageService, Tram) {

    var slug = createSlug({lang: 'de'});

    function getConfig() {
      var json = localStorageService.get('localStorageKey');
      console.log("Retrieved config from local storage: ", json);
      return json == undefined ? [] : json;
    }

    function saveConfig(config) {
      localStorageService.add('localStorageKey', config);
    }

    // variable to hold only a singleton of possibleViews()
    var views = null;

    function possibleViews() {
      if (views == null) {
        views = getConfig();
      }

      console.log("Found views: ", views)
      return views;
    }

    function clearCache() {
      views = null;
    }

    return {

      possibleViews: possibleViews,

      getView: function(id) {
        var foundViews = _.filter(possibleViews(), function(view) {
          return view.id == id;
        });
        console.log("Found views: ", foundViews);
        if (foundViews.length > 0) return foundViews[0];
      },

      saveView: function(view) {
        var config = getConfig()

        if (view.id == undefined) {
          view.id = slug(view.name);
        }

        var foundViews = _.filter(config, function(existingView) {
          return view.id == existingView.id;
        });

        if (foundViews.length > 0) {
          view.id = slug(view.name);
          _.extend(foundViews[0], view);
        }
        else {
          config.push(view);
        }

        saveConfig(config);
        clearCache();
      },

      deleteView: function(view) {
        var config = getConfig()

        config = _.filter(config, function(existingView) {
          return existingView.id != view.id;
        });

        saveConfig(config);
        clearCache();
      },

    }
  }

]);