// User shall not have two locations with same name

var runInSeries = require('async-waterfall');

module.exports = function (io, db, logger, auth, commandChains) {

    commandChains.add({
        command: 'search item',
        verifyUser: (data, next) => { next(null, true); },
        isAllowed: (data, _, next) => { next(null, true); },
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, item, next) => {
            var sql = "select itemname, itemdescription, itemprice, latitude, longitude, ts_rank(searchvector, keywords, 8) as rank from "+ 
                      "items, locations, to_tsquery($1) keywords " +
                      "where keywords @@ searchvector and items.location_id = locations.location_id order by rank desc";
            db.query(sql, [item], next);
        },
        prepareDataForTransmit: (result, next) => { 
            var items = [];
            for (i=0; i<result.rows.length; i++) {
                items.push({
                    name: result.rows[i].itemname,
                    description: result.rows[i].itemdescription,
                    price: result.rows[i].itemprice,
                    latitude: result.rows[i].latitude,
                    longitude: result.rows[i].longitude
                });
            }
            next(null, items);
         }
    });

    commandChains.add({
        command: 'search suggestions',
        verifyUser: (data, next) => { next(null, true); },
        isAllowed: (data, _, next) => { next(null, true); },
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, item, next) => {
            var sql = "select itemname as item, ts_rank(searchvector, keywords, 8) as rank from items, to_tsquery($1) keywords " +
                      "where keywords @@ searchvector order by rank desc";
            db.query(sql, [item], next);
        },
        prepareDataForTransmit: (result, next) => {
            var items = [];
            for (i=0; i<result.rows.length; i++) {
                items.push(result.rows[i].item);
            }
            next(null, items);
         }
    });

    function listen(socket) {

        function search(item) {
        var dbConnection, dbDone;

            function sendFindings(findings, callback) {
                socket.emit('search item', {err: 0, result: findings});
                callback();
            }

            runInSeries([
                db.createConnection,
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                (cb) => { db.searchItem(item, dbConnection, cb) },
                sendFindings
            ], function (err, result) {
                dbDone();
                if (err) throw err;
            });
            logger.log('info', 'search for: ' + item);
        }
        
        function suggest(item) {
        var dbConnection, dbDone;

            function sendSuggestions(findings, callback) {
                logger.log('info', 'suggestions for: ' + item);
                logger.log('info', 'are ' + findings);
                socket.emit('search suggestions', {err: 0, result: findings});
                callback(false);
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
        }

        socket.on('search item', search);
        socket.on('search suggestions', suggest);
    }

    //io.on('connection', listen);
}
