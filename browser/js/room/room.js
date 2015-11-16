app.config(function ($stateProvider){
	$stateProvider.state('room', {
		url:'/:roomName',
		templateUrl: 'js/room/room.html',
		controller: 'roomCtrl'
	})
})

app.controller('roomCtrl', function($scope, Socket, $stateParams, $rootScope, $state){
	$scope.roomData = {};
	Socket.emit('join room', $stateParams.roomName);
	Socket.on('room data', function(roomData){
		$scope.players = roomData.players;
		$scope.roomData = roomData;
		$scope.guesses = roomData.guesses;
		$scope.$digest();
	})
	$scope.roomName = $stateParams.roomName;
	$scope.guesses = [];
	$scope.makeGuess = function(guess){
		// can only guess if you aren't drawing
		if (!$rootScope.canIDraw){
			// $scope.guesses.push(guess);
			Socket.emit('guess', {roomName: $stateParams.roomName, guess: guess, guesser:$rootScope.username});
			$scope.theGuess = '';			
		}
	}

	// COLORS
	$scope.colorList = ['#ff0000', '#00ffe7', '#ff6f00', '#0400ff', '#f5ff00', '#fff'];
	$scope.currentColor = '#ff0000';
	$scope.setColor = function(color){
		$scope.currentColor = color;
	}
	// CLEAR CANVAS
	$scope.clearCanvas = function() {
		// only works if it's your turn
		if ($rootScope.canIDraw){
			Socket.emit('clear canvas', {roomName: $stateParams.roomName});
		}
	}
	Socket.on('clear canvas', function() {
		$rootScope.$broadcast('clear canvas');
	})

	// send/receive draw events
	// had to modify the angular-canvas-painter bower component to make this work
	$scope.$on('send draw', function(evt, data){
		Socket.emit('draw event', data)
	})
	Socket.on('receive draw', function(data){
		$rootScope.$broadcast('receive draw', data);
	})


	// guess engine
	Socket.on('new guess', function(guessList){
		$scope.guesses = guessList;
		$scope.$digest();
	})

	$rootScope.drawChecker = function(){
		// console.log($scope.currentDrawer);
		if (!$scope.currentDrawer) return;
		return $scope.currentDrawer.name == $rootScope.username;
	}

	//	game logic -- comply with server clock
	Socket.on('tick', function(roomData){
		// console.log(roomData);

		$scope.players = roomData.players;
		$scope.currentWord = roomData.currentWord;
		$scope.currentDrawer = roomData.currentDrawer;
		
		// console.log('can they draw??', $rootScope.canIDraw);
		if (roomData.currentGame){
			$scope.timer = roomData.timer;
			$scope.timeState = 'Time remaining: ';
			$scope.wordState = 'Current word is: ';
		}
		else {
			$scope.timer = roomData.betweenTimer;
			$scope.timeState = 'Next round in: ';
			$scope.wordState = 'Your word is: ';
		}

		$scope.$digest();
		$rootScope.canIDraw = $rootScope.drawChecker();
	})

	Socket.on('game over', function(roomData){
		console.log("GAME OVER MAN")
		$rootScope.lastGameData = roomData;
		$state.go('gameOver', {roomName: $stateParams.roomName})
	})

})

