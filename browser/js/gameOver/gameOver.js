app.config(function($stateProvider){
	$stateProvider.state('gameOver', {
		url: '/:roomName/gameOver',
		templateUrl: 'js/gameOver/gameOver.html',
		controller: 'gameOverCtrl'
	})
})

app.controller('gameOverCtrl', function($scope, Socket, $stateParams, $state, $rootScope){
	$scope.gameData = $rootScope.lastGameData;

	$scope.players = (_.sortBy($scope.gameData.players, 'points')).reverse();
	$scope.winner = $scope.players[0];

	$scope.wrongGuesser = $scope.players.reduce(function(prev, curr){
		if (prev.wrongGuesses > curr.wrongGuesses) return prev;
		else return curr;
	})

	$scope.consolation = _.sample($scope.players);

	$scope.crazyStuff = _.sample($scope.gameData.cachedGuesses);
	$scope.craziestGuesser = $scope.crazyStuff.guesser;
	$scope.craziestGuess = $scope.crazyStuff.guess;

	$scope.goToLobby = function(){
		$state.go('home');
	}
})