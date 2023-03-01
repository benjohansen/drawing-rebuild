const express = require("express");// use express to serve up the UI page
const app = express();
const http = require("http").Server(app);// Socket.IO uses a http server
const io = require("socket.io")(http);

const port = process.env.PORT || 5001;

let onlineUsers = [];

app.use(express.static(__dirname + "/public"));

// connection listener
io.on("connection", function (socket) {
	socket.removeAllListeners();
	//generate a unique name and assign it
	let newUsername = Math.floor(Math.random()*10000);
	socket.randomname = newUsername;
	onlineUsers++;
	// give them their name and send user count
	socket.emit("name-assignment", newUsername);
	socket.emit("online-users", onlineUsers);
	// create a list of friends (using their "randomname")
	let friendList = [];

	//maybe this should use a forEach?
	io.sockets.clients((error, clients) => {
		friendList = [];
		if (error) throw error;
		for (let i = 0; i < clients.length; i++) {
			// query each of the connected clients for their name
			friendList[i] = io.sockets.connected[clients[i]].randomname;
		}
		// send the list
		io.emit("friend-list", friendList);
	});

	// pass along all the incoming messages to everyone
	socket.on("friend-data", (msg) => {
		socket.broadcast.emit("friend-data", msg);
	});

	// client disconnection handler
	socket.on("disconnect", function () {
		onlineUsers--;
		console.log("user disconnected. Now there are " + onlineUsers);
		let friendList = [];
		io.sockets.clients((error, clients) => {
			friendList = [];
			if (error) throw error;
			for (let i = 0; i < clients.length; i++) {
				friendList[i] = io.sockets.connected[clients[i]].randomname;
			}
			io.emit("friend-list", friendList);
		});
		io.emit("online-users", onlineUsers);
	});
});

http.listen(port, function () {
	console.log("listening on *:" + port);
});
