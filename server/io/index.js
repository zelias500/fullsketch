'use strict';
var socketio = require('socket.io');
var io = null;
var _ = require('lodash');

module.exports = function (server) {

	var rooms = {};
    var clients = {};

    if (io) return io;

    io = socketio(server);

    io.on('connection', function (socket) {
        console.log('new connection from socket id:', socket.id);
        io.emit('here are some rooms', rooms);

        socket.on('create new room', function(newRoomData){
        	// newRoomData.players = [socket.id]
            var gameStateStuff = {
                currentGame: false,
                timer: newRoomData.roundTime,
                betweenTimer: 15,
                turnList: [], // list of users whose turn it will be
                currentWord: newRoomData.wordlist.words[0],
                guesses: [],
                currentDrawer: 'placeholder'
            }
            _.extend(newRoomData, gameStateStuff);
        	rooms[newRoomData.name] = newRoomData;
        	socket.join(newRoomData.name);
        	console.log(clients[socket.id], "created and joined room", newRoomData.name);
        	io.emit('here are some rooms', rooms);
        })

        socket.on('join room', function(roomName){
            console.log('all rooms', rooms);
        	if (!rooms[roomName].players) rooms[roomName].players = [];
        	rooms[roomName].players.push(clients[socket.id]);
        	console.log(clients[socket.id], 'joined', rooms[roomName]);
            socket.join(roomName);
        	io.to(roomName).emit('room data', rooms[roomName]);

            if (rooms[roomName].players.length > 2){
                // var betweenGames = setInterval(function(){
                //     rooms[roomName].betweenTimer--;
                //     io.to(roomName).emit('tick')
                // }, 1000)

                // io.to(roomName).emit('game start', rooms[roomName]);
            }
        })

        socket.on('clear canvas', function(data){
            io.to(data.roomName).emit('clear canvas');
            // socket.broadcast.to(data.roomName).emit('clear canvas');
        })

        socket.on('guess', function(data){
            rooms[data.roomName].guesses.push(data.guess);
            io.to(data.roomName).emit('new guess', rooms[data.roomName].guesses)
        })

        socket.on('draw event', function(data){
            socket.broadcast.emit('receive draw', data);
        })

        socket.on('new user', function(username){
            clients[socket.id] = username;
            console.log(clients);
        })

    });

    io.on('disconnect', function(socket){
    	console.log(socket.id, "disconnected")
    })

    // game clock/logic
    var x = setInterval(function(){
        Object.keys(rooms).forEach(function(room){
            if (rooms[room].currentGame) {
                rooms[room].timer--;

                // make sure betweenTimer is refreshed
                if (rooms[room].betweenTimer < 15) rooms[room].betweenTimer = 15;

                // if time is up, prepare to move to next round
                if (rooms[room].timer == 0){
                    // decrement # of rounds remaining
                    rooms[room].numRounds--;
                    // pick a new word
                    rooms[room].currentWord = rooms[room].wordlist.words[Math.floor(Math.random*rooms[room].wordlist.words.length)];
                    // shift up next drawer
                    rooms[room].currentDrawer = rooms[room].turnList.shift();

                    rooms[room].currentGame = false;

                    // emit round over event with room data
                    // this happens anyway with the 'tick' event
                    // io.to(room).emit('round over', rooms[room]);
                }
            }
            else {
                rooms[room].betweenTimer--;
                
                // make sure timer is refreshed
                if (rooms[room].timer < rooms[room].roundTime) rooms[room].timer = rooms[room].roundTime;

                // if betweenTimer runs out, time for the next round
                if (rooms[room].betweenTimer == 0){
                    rooms[room].currentGame = true;
                }
            }
            // console.log(rooms[room].timer);
            io.to(room).emit('tick', rooms[room]);
        })
    }, 1000)


    return io;

};
