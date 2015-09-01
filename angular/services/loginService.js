frontest.service('loginService', ['$http', '$location', 'store', function($http, $location, store){

	this.login = function(name, password) {
		$http.post('/login', {name: name, password: password}).success(function(token){
			if (token) {
	      		//store.token = token.token;
	      		//store.userName = token.name;

	      		console.log("Token: " + token);
	      		//transitionService.GoToPage('/');
      		}
		}).error(function(err){
			$log.log(err);
		});
	};

}]);