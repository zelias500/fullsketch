app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'lobbyCtrl',
        resolve: {
        	wordlists: function($http){
        		return $http.get('/api/wordlists').then(function(res){
        			return res.data;
        		})
        	}
        }
    });
});

app.controller('lobbyCtrl', function($scope, $state, Socket, wordlists, $uibModal, $rootScope){
	var modalInstance = $uibModal.open({
		animation: true,
		templateUrl: 'js/home/username.html',
		controller: 'modalCtrl',
		backdrop: 'static'
	})
	modalInstance.result.then(function(username){
		$rootScope.username = username;
		Socket.emit('new user', username);
	})		

	$scope.wordlists = wordlists;

	Socket.on('here are some rooms', function(rooms){
		$scope.rooms = rooms
		$scope.$digest();
	})

	$scope.showRoomDetails = function(room) {
		$scope.selectedRoom = room;
	}

	$scope.goToRoom = function(room) {
		$state.go('room', {roomName: room.name})
	}

	$scope.createRoom = function() {
		$scope.createLobby = false;
		Socket.emit('create new room', $scope.newRoom);
		$state.go('room', {roomName: $scope.newRoom.name});
	}

	Socket.on('tick', function(data){
		// console.log('tick', data.timer);
		$scope.timeKeeper--;
		$scope.$digest();
	})


})

app.controller('modalCtrl', function($scope, $uibModalInstance){
	$scope.submitUsername = function(){
		if ($scope.username.length > 3){
			$uibModalInstance.close($scope.username);
		}
	}
})