class Player {
	constructor(name, socketId){
		this.name = name;
		this.points = 0;
		this.socketId = socketId;
		this.wrongGuesses = 0;
	}

	addPoints(pts){
		this.points += pts;
		return pts;
	}
}