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
        socket.on('give me the rooms', function(){
            io.emit('here are some rooms', rooms);
        })

        socket.on('create new room', function(newRoomData){
            // if (socket.rooms.length) {
            //     console.log("SOCKET ROOMS", socket.rooms);
            //     socket.rooms.forEach(function(room){
            //         socket.leave(room);
            //     })
            //     console.log("SOCKET ROOMS", socket.rooms);

            // }
            // console.log("SHOULD JUST BE CURRENT ROOM", socket.rooms);

            var gameStateStuff = {
                currentGame: false,
                timer: newRoomData.roundTime,
                betweenTimer: 15,
                turnList: [], // list of users whose turn it will be
                currentWord: newRoomData.wordlist.words[0],
                guesses: [],
                cachedGuesses: [],
                currentDrawer: 'placeholder'
            }
            _.extend(newRoomData, gameStateStuff);
        	rooms[newRoomData.name] = newRoomData;
        	socket.join(newRoomData.name);
        	console.log(clients[socket.id], "created and joined room", newRoomData.name);
        	io.emit('here are some rooms', rooms);
        })

        socket.on('join room', function(roomName){
            // if (socket.rooms.length) {
            //     socket.rooms.forEach(function(room){
            //         socket.leave(room);
            //     })
            // }
            // console.log('all rooms', rooms);
            var newPlayer = {name: clients[socket.id], points: 0, wrongGuesses: 0}
        	if (!rooms[roomName].players) rooms[roomName].players = [];
            rooms[roomName].players.push(newPlayer);
        	rooms[roomName].turnList.push(newPlayer);
        	console.log(clients[socket.id], 'joined', rooms[roomName]);
            socket.join(roomName);
        	io.to(roomName).emit('room data', rooms[roomName]);
        })

        socket.on('clear canvas', function(data){
            io.to(data.roomName).emit('clear canvas');
        })

        socket.on('guess', function(data){
            // if the guess is correct
            if (rooms[data.roomName].currentWord == data.guess){
                // calculate points
                var points = rooms[data.roomName].wordlist.difficulty * rooms[data.roomName].timer;
                // find guesser and drawer and add points
                // data.guesser is the name of the user

                // give the guesser and drawer points
                rooms[data.roomName].players.map(function(player){
                    if (player.name == data.guesser || player.name == rooms[data.roomName].currentDrawer.name) player.points += points;
                    return player;
                })

                // clear array of guesses
                rooms[data.roomName].guesses = [{guesser: data.guesser, guess:'GUESSED RIGHT! THE WORD WAS '+data.guess}];

                // add points to the guesser and the drawer
                // points = wordlist difficulty * time remaining

                // switch game state
                rooms[data.roomName].timer = 0



            }
            // if not correct, just push onto array
            else {
                rooms[data.roomName].guesses.push({guess: data.guess, guesser: data.guesser}); 
                rooms[data.roomName].players.map(function(player){
                    if (player.name == data.guesser) player.wrongGuesses++;
                    return player;
                })
            }

            rooms[data.roomName].cachedGuesses.push({guess: data.guess, guesser: data.guesser})

            io.to(data.roomName).emit('new guess', rooms[data.roomName].guesses)

        })

        socket.on('draw event', function(data){
            socket.broadcast.emit('receive draw', data);
        })

        socket.on('new user', function(username){
            clients[socket.id] = username;
        })

    });

    io.on('disconnect', function(socket){
    	console.log(socket.id, "disconnected")
    })

    // game clock/logic
    var x = setInterval(function(){
        Object.keys(rooms).forEach(function(room){

            // need to be more rounds 
            if (!rooms[room].turnList.length && rooms[room].numRounds > 0){
                rooms[room].turnList.push(_.sample(rooms[room].players));
            }


            if (rooms[room].currentGame) {
                rooms[room].timer--;

                // make sure betweenTimer is refreshed
                if (rooms[room].betweenTimer < 15) rooms[room].betweenTimer = 15; 

                // if time is up, prepare to move to next round
                if (rooms[room].timer < 0){
                    // decrement # of rounds remaining
                    rooms[room].numRounds--;
                    // pick a new word
                    rooms[room].currentWord = rooms[room].wordlist.words.shift();
                    
                    // shift up next drawer
                    rooms[room].currentDrawer = rooms[room].turnList.shift();

                    rooms[room].currentGame = false;

                }
            }
            else {

                // if we're just getting started (more than one player)
                if (rooms[room].currentDrawer == 'placeholder'){
                    console.log('do we get in here?')
                    // generate a randomized list of drawers
                    rooms[room].turnList = _.shuffle(rooms[room].players);
                    // randomize the order of the wordlist
                    rooms[room].wordlist.words = _.shuffle(rooms[room].wordlist.words);
                    // shift up next drawer
                    rooms[room].currentDrawer = rooms[room].turnList.shift();
                } 

                // if we're done
                else if (rooms[room].numRounds < 1){
                    // stop the game
                    io.to(room).emit('game over', rooms[room]);
                    // for each client, kick em out
                    for (var socketId in io.sockets.connected){
                        var socket = io.sockets.connected[socketId];
                        if (socket.rooms.indexOf(room) != -1) socket.leave(room);
                        delete rooms[room];
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

            }
            io.to(room).emit('tick', rooms[room]);
        })
    }, 1000)


    return io;

};
