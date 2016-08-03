// User shall not have two locations with same name

var runInSeries = require('async-waterfall');

module.exports = function (io, db, logger, auth) {

    function listen(socket) {

        function search(item) {
        var dbConnection, dbDone;

            function sendFindings(findings, callback) {
                socket.emit('search item', findings);
                callback();
            }

            runInSeries([
                db.createConnection,
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                (cb) => { db.searchItem(item, cb) },
                sendFindings
            ], function (err, result) {
                if (err) throw err;
                dbDone();
            });
            logger.log('info', 'search for: ' + item);
        }
        
        function suggest(item) {
        var dbConnection, dbDone;

            function sendSuggestions(findings, callback) {
                socket.emit('search suggestions', findings);
                callback();
            }

            runInSeries([
                db.createConnection,
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                (cb) => { db.suggestItems(item, dbConnection, cb); },
                sendSuggestions
            ], function (err, result) {
                if (err) throw err;
                dbDone();
            });
            logger.log('info', 'suggestions for: ' + item);
        }

        function addLocation(clientData) {
            var dbConnection, dbDone, user;

            runInSeries([
                (cb) => { auth.verifyUser(clientData.token.token, cb); },
                (username, cb) => { user = username; cb(); },
                db.createConnection,
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                (cb) => { db.getUser(user, dbConnection, cb); },
                (userData, cb) => { db.addLocation(userData.id, clientData, dbConnection, cb); }
            ], function (err, result) {
                if (err) throw err;
                logger.log('info', 'location for user ' + user + ' added');
                dbDone();
            });
        }

        socket.on('search item', search);
        socket.on('search suggestions', suggest);
        socket.on('add location', addLocation);
    }

    io.on('connection', listen);
}
