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
        "stations": [
          {
            "station": {
              "name": "Zürich, Hirschwiesenstrasse",
              "id": "008591193"
            },
            "keywords": "bahnhofplatz, triemli",
          },
        ],
        "id": "hirschi-city"
      },
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
      console.log("Saving to local storage: ", config);
      localStorageService.add('localStorageKey', config);
    }

    function getView(id) {
      var foundView = _.find(possibleViews(), function(view) {
        return view.id == id;
      });
      console.log("Found view with id: ", id, ", ", foundView);

      return foundView;
    }

    // variable to hold only a singleton of possibleViews()
    var views = null;

    function possibleViews() {
      if (views == null) {
        console.log("Found views: ", views)
        views = getConfig();
      }

      return views;
    }

    function clearCache() {
      views = null;
    }

    function newSlug(name, oldSlug, index) {
      var id = slug(name);

      if (index) {
        id += index;
      }
      else {
        index = 0;
      }

      if (getView(id) && oldSlug != id) {
        return newSlug(name, oldSlug, index + 1);
      }
      else {
        return id;
      }
    }

    return {

      possibleViews: possibleViews,

      getView: function(id) {
        var foundView = getView(id);
        if (foundView) {
          return foundView;
        }
        else {
          return {
            stations: []
          }
        }
      },

      saveView: function(view) {
        var config = getConfig()

        if (view.id == undefined) {
          view.id = newSlug(view.name);
          config.push(view);
        }
        else {
          var foundView = _.find(config, function(existingView) {
            return view.id == existingView.id;
          });
          view.id = newSlug(view.name, view.id);

          _.extend(foundView, view);
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