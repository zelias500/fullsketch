app.config(function ($stateProvider){
	$stateProvider.state('room', {
		url:'/:roomName',
		templateUrl: 'js/room/room.html',
		controller: 'roomCtrl'
	})
})

app.controller('roomCtrl', function($scope, Socket, $stateParams, $rootScope){
	$scope.roomData = {};
	Socket.emit('join room', $stateParams.roomName);
	Socket.on('room data', function(roomData){
		roomData.players = roomData.players.map(function(player){
			return {name: player, points:0};
		})
		$scope.roomData = roomData;
		$scope.$digest();
	})
	$scope.roomName = $stateParams.roomName;
	$scope.guesses = [];
	$scope.makeGuess = function(guess){
		// $scope.guesses.push(guess);
		Socket.emit('guess', {roomName: $stateParams.roomName, guess: guess});
		$scope.theGuess = '';
	}

	// COLORS
	$scope.colorList = ['#ff0000', '#00ffe7', '#ff6f00', '#0400ff', '#f5ff00', '#fff', '#000'];
	$scope.currentColor;
	$scope.setColor = function(color){
		$scope.currentColor = color;
	}
	// CLEAR CANVAS
	$scope.clearCanvas = function() {
		Socket.emit('clear canvas', {roomName: $stateParams.roomName});
		// $scope.canvasVersion = 0;
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

	//	game logic?
	Socket.on('tick', function(roomData){
		$scope.currentWord = roomData.currentWord;
		$scope.currentGuesser = roomData.currentGuesser;
		if (roomData.currentGame){
			$scope.timer = roomData.timer;
			$scope.timeState = 'Time remaining: ';
			$scope.wordState = 'Current word is: ';
		}
		else {
			$scope.timer = roomData.betweenTimer;
			$scope.timeState = 'Next round in: ';
			$scope.wordState = 'Next word is: ';
		}

		$scope.$digest();
	})

})

