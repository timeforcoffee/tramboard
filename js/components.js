var tramDirectives = angular.module('tramDirectives', []);

tramDirectives.directive('tabs', ['storage', function(storage){
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      viewSelectionString: '@',
      currentView: '@',
      mode: '@'
    },
    templateUrl: 'tabs.html',
    controllerAs: 'TabsCtrl',
    controller: function($scope) {
      var TabsCtrl = this;

      if ($scope.viewSelectionString) {
        TabsCtrl.viewSelection = _.chain($scope.viewSelectionString.split('/')).filter(function(item) {return item.trim() != ''}).map(function(item) {return [item.trim(), true]}).object().value();
      }

      TabsCtrl.currentView   = $scope.currentView;
      TabsCtrl.mode          = $scope.mode;

      TabsCtrl.possibleViews = function() {
        return storage.possibleViews();
      };

      TabsCtrl.createPath = function(view) {
        console.log('createPath: ', TabsCtrl.viewSelection, view)

        var selection = TabsCtrl.viewSelection 

        if (!selection) selection = {}
        if (!selection[view]) selection[view] = false

        var path = _.reduce(selection, function(memo, selected, viewId) {
          if ((selected && viewId != view)
            || (!selected && viewId == view)) {
            return memo + viewId + '/' 
          }
          else return memo
        }, '').trim('/')

        console.log('returning path: ', path)
        return path
      }
    }
  }
}]);
