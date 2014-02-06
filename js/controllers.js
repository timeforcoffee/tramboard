var tramControllers = angular.module('tramControllers', []);

tramApp.controller('ListCtrl', ['$scope', 'storage', function($scope, $timeout, storage) {
  // actually no need for much here yet
}]);

tramApp.controller('CreateCtrl', ['$scope', 'Tram', 'storage', function($scope, Tram, storage) {
  // this is the controller for editing the config

  $scope.save = function() {
    console.log("Creating ", $scope.view);
  }

}]);

tramApp.controller('TramCtrl', ['$scope', '$timeout', 'Tram', 'storage', function($scope, $timeout, Tram, storage) {

  $scope.refreshInterval = 10000;

  /**
   * We initialize the model with 50 empty trams for each destination.
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
      Tram.query({station:query.station}, function(trams){
        console.log("Handling answer for station: ", query.station, ", groups: ", query.groups, ", answer: ", trams);

        // we iterate over each possible group and fill the trams array
        _.each(query.groups, function(group) {

          // we get the elements of the group in the group_trams variable
          var group_trams = _.filter(trams, function(tram) {

            // we find any word in "contains" that matches the destination
            // if it's more than 0, then we know it matches
            var found_words = _.find(group.contains, function(word) {
              // console.log("Checking if ", tram.to, " contains ", word);

              return tram.to.toLowerCase().indexOf(word) != -1
            });
            // console.log("Found words ", found_words, " for ", tram.to)
            return found_words != undefined && found_words.length > 0;
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