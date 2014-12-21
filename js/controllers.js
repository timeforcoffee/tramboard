var tramControllers = angular.module('tramControllers', ['ngRoute']);

tramApp.config(function($routeProvider) {
  $routeProvider
    .when('/new', {
      controller:'EditCtrl as EditCtrl',
      templateUrl:'edit.html'
    })
    .when('/view/:viewSelectionString*', {
      controller:'TramCtrl as TramCtrl',
      templateUrl:'tram.html'
    })
    .when('/edit/:viewId', {
      controller:'EditCtrl as EditCtrl',
      templateUrl:'edit.html'
    })

    .otherwise({
      redirectTo:'/new'
    });
})

tramApp.controller('EditCtrl', ['$location', '$window', '$scope', '$routeParams', 'Tram', 'storage', function($location, $window, $scope, $routeParams, Tram, storage) {

  $scope.$on('$viewContentLoaded', function(event) {
    $window.ga('send', 'pageview', { page: $location.path() });
  });

  var EditCtrl = this;
  EditCtrl.view = _.clone(storage.getView($routeParams.viewId));

  EditCtrl.addStation = function() {
    console.log("Adding station to view: ", EditCtrl.view);
    EditCtrl.view.stations.push({keywords: ''});
  }

  EditCtrl.removeStation = function(index) {
    console.log("Removing station from view: ", EditCtrl.view);
    EditCtrl.view.stations.splice(index, 1);
  }

  EditCtrl.save = function() {
    console.log("Saving ", EditCtrl.view);
    storage.saveView(EditCtrl.view);

    // dimension2 is the number of stations
    $window.ga('send', 'event', 'view', 'add', {dimension2: EditCtrl.view.stations.length, page: $location.path() });

    $location.path('/view/' + EditCtrl.view.id);
  }

  EditCtrl.delete = function() {
    console.log("Deleting ", EditCtrl.view);
    storage.deleteView(EditCtrl.view);
    
    // dimension2 is the number of stations
    $window.ga('send', 'event', 'view', 'delete', {dimension2: EditCtrl.view.stations.length,  page: $location.path() });

    EditCtrl.view = null;
    $location.path('/');
  }

  EditCtrl.getStations = function(text) {
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

tramApp.controller('TramCtrl', ['$location', '$window', '$scope', '$routeParams', '$timeout', 'storage', 'Tram', function($location, $window, $scope, $routeParams, $timeout, storage, Tram) {

  $scope.$on('$viewContentLoaded', function(event) {
    // dimension3 is the number of views on the page
    $window.ga('send', 'pageview', { page: $location.path(), dimension3: TramCtrl.viewSelection().length });
  });


  var TramCtrl = this;
  var refreshInterval = 10000;

  TramCtrl.viewSelectionString = $routeParams.viewSelectionString;

  /**
   * We initialize the model with nothing
   */
  TramCtrl.trams = {};

  TramCtrl.viewSelection = function() {
    var viewSelection = _.chain(TramCtrl.viewSelectionString.split('/')).filter(function(item){return item.trim() != ''}).map(function(item){return item.trim()}).value();
    return viewSelection;
  };

  /*TramCtrl.hjs = HueJS({
            ipAddress:"10.10.0.195",
                devicetype:"test user",
                username: "newdeveloper"
            });*/

  /**
   * We regularly update the model with the new departures.
   */
  (function update() {
    $timeout(update, refreshInterval);
    console.log('Updating data. Current data, trams: ', TramCtrl.trams);
    console.log('Current view selection: ', TramCtrl.viewSelection())

    // if the view is set
    if (TramCtrl.viewSelection().length > 0) {
      var views = _.map(TramCtrl.viewSelection(), function(viewId) {return storage.getView(viewId)});

      async.map(views, function(currentView, viewSelectionCallback) {

        async.map(currentView.stations, function(station, callback) {
          // dimension1 is the station queried
          // dimension2 is the number of stations in a view
          // dimension3 is the number of views on the page
          $window.ga('send', 'event', 'station', 'query', { 
            dimension1: station.stat.name + '/' + station.stat.id, 
            dimension2: currentView.stations.length, 
            // we don't send it here because if would be wrong 
            // dimension3: views.length, 
            page: $location.path() 
          });

          Tram.queryStation({station: station.stat.id}, function(trams) {
            console.log("Handling answer for station: ", station.stat.name, ", answer: ", trams);

            // we get the trams that interest us
            var filteredTrams = _.filter(trams, function(tram) {
              var keywords = station.keywords.trim().length == 0 ? [] : station.keywords.split(',')

              // we find any word in "contains" that matches the destination
              // if it's more than 0, then we know it matches
              var foundWords = _.find(keywords, function(word) {
                // console.log("Checking if ", tram.to, " contains ", word);

                return tram.to.toLowerCase().indexOf(word.trim().toLowerCase()) != -1
              });
              // console.log("Found words ", foundWords, " for ", tram.to)
              return keywords.length == 0 || (foundWords != undefined && foundWords.length > 0);
            })

            console.log("Found trams for station ", station.stat.name, ": ", filteredTrams);

            callback(null, filteredTrams);
          })
        }, function(err, results) {
          // results is an array of results
          console.log("Filtered results for all stations: ", results);

          var filteredTrams = _.flatten(results);
          filteredTrams = _.sortBy(filteredTrams, function(item) {
            return item.departure;
          })

          console.log("Filtered trams sorted: ", filteredTrams);

          // this is to initialize scope.trams if it's not done yet (first time this is executed)
          if (!TramCtrl.trams[currentView.id]) {
            TramCtrl.trams[currentView.id] = filteredTrams
          }

          // we extend the tram list with the new tram stuff
          _.each(TramCtrl.trams[currentView.id], function(element, index){
            _.extend(element, filteredTrams[index]);
          })

          viewSelectionCallback(null, true)

          // we set the light
          /*var firstTram;
          if ($scope.trams[$scope.viewId]) {
            var tramsBwn3and4Min = _.filter($scope.trams[$scope.viewId], function(tram) {
              return (tram.in_minutes <= 4 && tram.in_minutes >=3);
            })
            // we found a tram
            if (tramsBwn3and4Min.length > 0) {
              firstTram = tramsBwn3and4Min[0];
            }
          }
          if (firstTram && (firstTram.number == 10 || firstTram.number == 14)) {
            console.log("Setting lamp to colored");
            var hue = firstTram.number == 10 ? 62031 : 47124;
            $scope.hjs.setValue(2, {hue: hue})
          }
          else {
            console.log("Setting lamp to white");
            $scope.hjs.setValue(2, {ct: 330})
          }*/

        })
      }, function(err, results) {})
    }

  }())

}])
