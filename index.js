var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var fs = require('fs');
let shell = require('shelljs');
var cron = require('node-cron');

var trelloRouter = require('./src/trelloRouter.js');// define our app using express
var trelloUtils = require('./src/trelloUtils.js');// define our app using express

var currentdate = function() {
  return new Date().toLocaleString();
}

app.use('/', trelloRouter);

app.get('/:idBoard', function(req, res, next) {
	var idBoard = req.params.idBoard;
  res.sendFile(__dirname + '/index.html');

  cron.schedule("* * * * * *", function(socket) {
    trelloUtils.proxiedRequestGet('https://api.trello.com/1/boards/' + idBoard + '/lists?filter=open&fields=name', res, next, io);
    //io.emit('chat message', tehteh);
  });
});

io.on('connection', function(socket) {
  socket.on('chat message', function(msg) {
    io.emit('chat message', msg);
  });
});



http.listen(port, function() {
  console.log('listening on *:' + port);
});
