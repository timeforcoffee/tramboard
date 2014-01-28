var tramServices = angular.module('tramServices', ['ngResource']);
 
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