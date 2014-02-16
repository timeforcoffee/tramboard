var tramControllers = angular.module('tramControllers', []);

tramApp.controller('ListCtrl', ['$scope', 'Tram', 'storage', function($scope, Tram, storage) {
  // actually no need for much here yet

  $scope.switch = function(id) {
    console.log("Switching to ", id);
    $scope.view = _.clone(storage.getView(id));
    console.log("$scope.view: ", $scope.view);
  }

  $scope.save = function() {
    console.log("Saving ", $scope.view);
    storage.saveView($scope.view);
  }

  $scope.delete = function() {
    console.log("Deleting ", $scope.view);
    storage.deleteView($scope.view);
    $scope.view = null;
  }

  $scope.getStations = function(text) {
    console.log("Autocomplete: ", text);

    return Tram.autocomplete({query:text}).$promise.then(function(stations){
      console.log("Got stations: ", stations);
      
      var result = _.map(stations.stations, function(station){
        return {
          name: station.name,
          id: station.id
        };
      })
      console.log("Autocomplete: ", result);
      return result;
    });
  }

}]);

tramApp.controller('TramCtrl', ['$scope', '$timeout', 'storage', function($scope, $timeout, storage) {

  $scope.refreshInterval = 10000;

  /**
   * We initialize the model with nothing
   */
  $scope.trams = {};

  $scope.possibleViews = function() {
    return storage.possibleViews();
  };

  /**
   * We regularly update the model with the new departures.
   */
  (function update() {
    $timeout(update, $scope.refreshInterval);
    var now = Date.now();

    console.log($scope.trams);

    var stationsToQuery = storage.stationsToQuery();
    console.log("Querying stations: ", stationsToQuery);

    _.each(stationsToQuery, function(query){
      // for each possible query
      storage.queryStation(query.station, function(trams) {
        console.log("Handling answer for station: ", query.station, ", groups: ", query.groups, ", answer: ", trams);

        // we iterate over each possible group and fill the trams array
        _.each(query.groups, function(group) {

          // we get the elements of the group in the group_trams variable
          var group_trams = _.filter(trams, function(tram) {

            // we find any word in "contains" that matches the destination
            // if it's more than 0, then we know it matches
            var found_words = _.find(group.contains, function(word) {
              // console.log("Checking if ", tram.to, " contains ", word);

              return tram.to.toLowerCase().indexOf(word.trim().toLowerCase()) != -1
            });
            // console.log("Found words ", found_words, " for ", tram.to)
            return group.contains.length == 0 || (found_words != undefined && found_words.length > 0);
          })

          console.log("Found trams for station ", query.station, ", and for group ", group.id, ": ", group_trams);

          // this is to initialize scope.trams if it's not done yet (first time this is executed)
          if (!(group.id in $scope.trams)) {
            $scope.trams[group.id] = group_trams
          }

          // we extend the tram list with the new tram stuff
          _.each($scope.trams[group.id], function(element, index){
            _.extend(element, group_trams[index]);

              var in_seconds = (element.departure - now) / 1000;
              element.in_minutes = Math.floor(in_seconds / 60);
          })

        })

      })
    })

  }())

}])