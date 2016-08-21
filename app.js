var app = require("express")();
var path = require("path");
var server = require("http").Server(app);
var io = require("socket.io")(server);
io.sockets.setMaxListeners(0);
var logger = require("./server/logging");

/**
 * Start the node server on port 3000.
 */
function startServer() {
    server.listen(3000, function () {
        logger.log("info", "Example app listening on port 3000!");
    });
}

var pool = require("./server/database")(logger, startServer);
var auth = require("./server/authentication")(io, pool, logger);
var cc = require("./server/commandChains")(io, pool, logger, auth);
var search = require("./server/search")(io, pool, logger, auth, cc);
var admin = require("./server/admin")(cc);

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "/client.html"));
});

// io.on('connection', function (socket) {
//   pool.connect(function(err, client, done) {
//     client.query('SELECT text FROM chat;', [], function(err, result) {
//       for (i=0; i<result.rows.length;i++) {
//         socket.emit('broadcast message', result.rows[i].text);
//       }
//       done();
//     });
//   });
//
//   socket.on('new message', function(message) {
//     socket.broadcast.emit('broadcast message', message);
//     socket.emit('broadcast message', message);
//
//     pool.connect(function(err, client, done) {
//       client.query('INSERT INTO chat (text) VALUES ($1);', [message], function(err, result) {
//         done();
//       });
//     });
//   });
// });
