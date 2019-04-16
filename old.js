//app.get('/', function(req, res) {
//  res.sendFile(__dirname + '/index.html');
//});

io.on('connection', function(socket) {
  socket.on('chat message', function(msg) {
    io.emit('chat message', msg);
  });
});

cron.schedule("* * * * * *", function(socket) {
  //io.emit('chat message', trelloUtils.doSomething());
  //io.emit('chat message', currentdate());
});
