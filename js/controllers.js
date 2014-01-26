var tramControllers = angular.module('tramControllers', []);

tramApp.controller('TramCtrl', ['$scope', '$timeout', 'Tram', function($scope, $timeout, Tram) {

  $scope.refreshInterval = 2000;

  $scope.config = [
    {
      station: 'Hirschwiesenstrasse',
      groups: [
        {
          contains: ['bahnhof', 'triemli'],
          id: 'hirschi_to_city',
          name: "Hirschi to city"
        },
        {
          contains: ['flughafen', 'seebach'],
          id: 'city_to_hirschi',
          name: "City to Hirschi"
        }
      ]
    },
    {
      station: 'Milchbuck',
      groups: [
        {
          contains: ['bahnhofplatz', 'wollishofen'],
          id: 'milchbuck_to_city',
          name: "Milchbuck to city"
        },
        {
          contains: ['morgental'],
          id: 'milchbuck_to_escher',
          name: "Milchbuck to Escher"
        }
      ]
    }
  ]

  // variable to hold only a singleton of possibleViews()
  $scope.views = null;
  $scope.possibleViews = function() {
    if ($scope.views == null) {
      var result = _.map($scope.config, function(station) {
        return _.map(station.groups, function(group) {
          return {
            id: group.id,
            name: group.name
          }
        })
      })
      $scope.views = _.flatten(result);
    }
    return $scope.views;
  };

  /**
   * We initialize the model with 50 empty trams for each destination.
   */
  $scope.trams = {};

  /**
   * We regularly update the model with the new departures.
   */
  (function update() {
    $timeout(update, $scope.refreshInterval);
    var now = Date.now();

    console.log($scope.trams);
    _.each($scope.config, function(query){
      // for each possible query
      Tram.query({station:query.station}, function(trams){
        console.log("Handling answer for station: ", query.station, ", groups: ", query.groups, ", answer: ", trams);

        // we iterate over each possible group and fill the trams array
        _.each(query.groups, function(group) {

          // we get the elements of the group in the group_trams variable
          var group_trams = _.filter(trams, function(tram) {

            // we find any word in "contains" that matches the destination
            // if it's more than 0, then we now it matches
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

              var departure_time = new Date(element.departure);
              var in_seconds = (departure_time - now) / 1000;

              element.in_minutes = Math.floor(in_seconds / 60);
          })

        })

      })
    })

  }())

}])