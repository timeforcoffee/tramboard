var tramDirectives = angular.module('tramDirectives', []);

tramDirectives.directive('tabs', ['storage', function(storage){
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      currentView: '@',
      mode: '@'
    },
    templateUrl: 'tabs.html',
    controllerAs: 'TabsCtrl',
    controller: function($scope) {
      var TabsCtrl = this;

      TabsCtrl.currentView  = $scope.currentView;
      TabsCtrl.mode         = $scope.mode;

      TabsCtrl.possibleViews = function() {
        return storage.possibleViews();
      };
    }
  }
}]);
