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
	    controller: function($scope) {
		  $scope.possibleViews = function() {
		    return storage.possibleViews();
		  };
	    }
	}
}]);
