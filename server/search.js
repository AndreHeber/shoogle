// User shall not have two locations with same name

var runInSeries = require('async-waterfall');

module.exports = function (io, db, logger, auth) {

  function listen(socket) {
    var dbConnection, dbDone;
    function search (item) {

      function sendFindings(findings, callback) {
        socket.emit('search item', findings);
        callback();
      }

      runInSeries([
        db.createConnection,
        (con, done, cb) => {dbConnection = con; dbDone = done; cb(); },
        (cb) => { db.searchItem(item, cb) },
        sendFindings
      ], function(err, result) {
        if (err) throw err;
        dbDone();
      });
      logger.log('info', 'search for: ' + item);
    }

    function addLocation(clientData) {
      var dbConnection, dbDone, user;

      runInSeries([
        (cb) => { auth.verifyUser(clientData.token.token, cb); },
        (username, cb) => {user = username; cb(); },
        db.createConnection,
        (con, done, cb) => {dbConnection = con; dbDone = done; cb(); },
        (cb) => { db.getUser(user, dbConnection, cb); },
        (userData, cb) => { db.addLocation(userData.id, clientData, dbConnection, cb); }
      ], function(err, result) {
        if (err) throw err;
        logger.log('info', 'location for user ' + user + ' added');
        dbDone();
      });
    }

    socket.on('search item', search);
    socket.on('add location', addLocation);
  }

  io.on('connection', listen);
}
