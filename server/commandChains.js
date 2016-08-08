var runInSeries = require('async-waterfall');

module.exports = function (io, db, logger, auth) {

    var commandChains = {};

    // a standard command chain:
    // var std_chain = {
    //     command: undefined,
    //     verifyUser: auth.verifyUser,
    //     isAllowed: undefined,
    //     checkData: undefined,
    //     prepareDataForDb: undefined,
    //     dbCommand: undefined,
    //     prepareDataForTransmit: undefined
    // }

    commandChains.add = function (chain) {
        var dbDone, dataForDb;
        io.on('connection', function (socket) {
            socket.on(chain.command, function (data) {
                runInSeries([
                            (cb) => { chain.verifyUser(data.token, cb); },
                        (id, cb) => { chain.isAllowed(id, data.user_id, cb); },
                    (result, cb) => { chain.checkData(data, cb); },
                    (result, cb) => { chain.prepareDataForDb(data, cb); },
                    (result, cb) => { dataForDb = result; db.createConnection(cb); },
                 (con, done, cb) => { dbDone = done; chain.dbCommand(con, dataForDb, cb); },
                    (result, cb) => { chain.prepareDataForTransmit(result, cb); }
                ],
                function (err, result) {
                    if (dbDone) dbDone();
                    socket.emit(chain.command, {err: err, result: result});
                });
            });
        });
    }

    return commandChains;
}
