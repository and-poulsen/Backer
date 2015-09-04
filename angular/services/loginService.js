frontest.service('loginService', ['$http', '$location', 'store', function($http, $location, store){

	this.login = function(name, password) {
		$http.post('/login', {username: name, password: password}).success(function(response){
			if (response.success === true) {
				store.set('Cookie', response.cookies);
	      		$location.path("");
      		} else {
				console.log("Wrong credentials.");
			}
		}).error(function(err){
			console.log(err);
		});
	};
	
	this.logOut = function() {
		store.remove("Cookie");
		$location.path("/login");
	};

}]);