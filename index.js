var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 8080;

let shell = require('shelljs');
var cron = require('node-cron');

var trelloRouter = require('./src/trelloRouter.js');// define our app using express
var trelloUtils = require('./src/trelloUtils.js');// define our app using express

var currentdate = function() {
  return new Date().toLocaleString();
}

app.use('/', trelloRouter);

app.use('/js', express.static(__dirname + '/js'));

app.get('/:idBoard', function(req, res, next) {
	var idBoard = req.params.idBoard;
  res.sendFile(__dirname + '/index.html');
  io.emit('chat message', 'called once');
  trelloUtils.getCardNumbers(req, res, next, io);

  //trelloUtils.proxiedRequestGet('https://api.trello.com/1/boards/' + idBoard + '/lists?filter=open&fields=name', res, next, io);

  cron.schedule("* * * * * *", function(socket) {
  //  trelloUtils.getCardNumbers(req, res, next, io);
    //trelloUtils.proxiedRequestGet('https://api.trello.com/1/boards/' + idBoard + '/lists?filter=open&fields=name', res, next, io);
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
