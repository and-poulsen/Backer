frontest.controller('mainController', ['$scope', '$log', 'loginService', function($scope, $log, loginService){
	$scope.login = function() {
		loginService.login($scope.name, $scope.password);
		$log.log('Logging in with: ' + $scope.name + $scope.password);
	};
	
}]);