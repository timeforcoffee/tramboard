'use strict';

var tramServices = angular.module('tramServices', ['ngResource', 'LocalStorageModule']);
 
// service to get the station board from opendata.ch
tramServices.factory('Tram', ['$resource',

  function($resource) {
    return $resource('http://transport.opendata.ch', {}, {
      queryZH: {method:'GET', url:'http://online.fahrplan.zvv.ch/bin/stboard.exe/dn?L=vs_stbzvv&input=:station&boardType=dep&productsFilter=1:1111111111111111&additionalTime=0&disableEquivs=false&maxJourneys=18&start=yes&monitor=1&requestType=0&view=preview', params:{station:'station'}, isArray:true, transformResponse: function(data, headers){
        var response = JSON.parse(data.replace('journeysObj = ', ''));
        console.log("Parsed response: ", response);

        return _.map(response.journey, function(entry){
          var dateItems = entry.da.split('.');

          var departure = new Date(dateItems[1]+'/'+dateItems[0]+'/'+dateItems[2]+' '+entry.rt.dlt);
          var undelayed = new Date(dateItems[1]+'/'+dateItems[0]+'/'+dateItems[2]+' '+entry.ti);

          var special;
          var number = entry.pr.replace(/ /g, '');
          if (number.charAt(0) == "N") special = "night";
          if (number.length == 3) special += " small";

          if (!departure || !departure.getFullYear()) departure = undelayed;

          var response = {
            departure: departure,
            undelayed: undelayed,
            to: entry.st.replace("Z\u00FCrich, ", ""),
            number: number,
            special: special
          }
          return response;
        });
      }},

      queryOpenTransport: {method:'GET', url: 'http://transport.opendata.ch/v1/stationboard?station=:station', params:{station:'station'}, responseType: 'json', isArray:true, transformResponse: function(data, headers){
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

      autocomplete: {method:'GET', url:'http://transport.opendata.ch/v1/locations?query=:query&type=station', params:{query:'query'}, responseType: 'json', isArray: false}
    });
  }

]);

// service to save and get the stuff from the local storage
tramServices.factory('storage', ['localStorageService', 'Tram',
  // service to read and write configuration

  function(localStorageService, Tram) {

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

    var stations = null;

    function stationsToQuery() {
      if (stations == null) {
        stations = _.map(_.groupBy(getConfig(), function(view){
          return view.station.id;
        }), function(group, key) {
          return {
            station: key,
            groups: _.map(group, function(view) {
              return {
                contains: view.keywords == undefined ? [] : view.keywords.split(','),
                id: view.id,
                name: view.name
              }
            })
          }
        })
      }
      return stations;
    }

    function clearCache() {
      views = null;
      stations = null;
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
          view.id = chance.guid();
        }

        var foundViews = _.filter(config, function(existingView) {
          return view.id == existingView.id;
        });

        if (foundViews.length > 0) {
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

      queryStation: function(station, callback) {
        console.log("Trying ZVV API");
        Tram.queryZH({station:station}, function(response) {
          callback(response);
        });
      },

      stationsToQuery: stationsToQuery

    }
  }

]);