function sendAndListen(channel, data, callback) {
    function call_back(data) {
        callback(data.err, data.result);
        socket.removeListener(channel, call_back);
    }
    socket.emit(channel, data);
    if (callback != null) {
        socket.on(channel, call_back);
    }
}

function emit(chain) {
    chain.nowRun();
    window.sendAndListen(chain.command, chain.data, function (err, result) {
        if (err) {
            chain.onError(err, result);
            console.log('Problem with command: ' + chain.command);
            console.log(err);
            console.log(result);
        } else {
            chain.onSuccess(result);
        }
    });
}

function nothing() {}
 function showProblem(message) { notie.alert(3, message, 2); }
 function showInfo(message) { notie.alert(1, message, 2); }

function findByIdIn(array, item) {
    for (i=0; i<array.length; i++) {
        if (array[i].id === item.id)
            return i;
    }
    return null;
}