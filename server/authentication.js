// TODO
// email verification
// password reset with email
// test with valid but wrong JWT
// renew JWT after one day
var bcrypt = require("bcrypt-nodejs");
var readline = require("readline");
var crypto = require("crypto");
var nJwt = require("njwt");
var runInSeries = require("async-waterfall");

module.exports = function (io, db, logger) {
    "use strict";
    var serverUnderDevelopment = true;
    var signingKey;
    var auth = {};

    auth.tokenCache = {};

    function generatePassword(secret) {
        crypto.pbkdf2(secret, "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1", 100000, 32, "sha512", function (err, key) {
            if (err) {
                logger.log("warn", "Error: " + err);
            }
            logger.log("info", "Signing key is " + key.toString("hex"));
            signingKey = key;
        });
    }

    function promptForPassword() {
        console.log("Please enter the password: >");
        var pwPrompt = readline.createInterface(process.stdin, process.stdout);
        pwPrompt.prompt();
        pwPrompt.on("line", function (password) {
            generatePassword(password);
        });
    }

    if (serverUnderDevelopment) {
        generatePassword("development");
    } else {
        promptForPassword();
    }


    auth.hashPassword = function (value, callback) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                logger.log("warn", "Error: " + err);
            }
            bcrypt.hash(value, salt, null, function (err, hash) {
                callback(err, hash);
            });
        });
    };

    function listen(socket) {

        function generateToken(user_id, callback) {

            function createJWT(user_id, key) {
                var claims = {
                    iss: "http://shoogle.com/",  // The URL of your service
                    sub: user_id,    // The UID of the user in your system
                    scope: "self"    // the user rights
                };
                var jwt = nJwt.create(claims, key);
                var oneWeek = Date.now() + (1000 * 60 * 60 * 24 * 7);
                jwt.setExpiration(oneWeek);
                return jwt.compact();
            }

            var token = createJWT(user_id, signingKey);
            socket.emit("store token", {err: 0, result: token});
            auth.tokenCache[token] = user_id;

            // clear cached token after 1 hour
            setTimeout(function () {
                auth.tokenCache[token] = undefined;
            }, 1000 * 60 * 60);

            auth.hashPassword(token, function (err, hashedToken) {
                callback(err, hashedToken);
            });
        }

        function getAndSendUserRoles(user_id, db, dbCon, callback) {
            db.getUserRoles(user_id, dbCon, function (err, result) {
                socket.emit("roles", {err: err, result: result});
                callback(err, result);
            });
        }

        function registerUser(data) {
            var dbConnection;
            var dbDone;
            var user_id;

            function userExistsInDb(callback) {
                db.userExists(data.username, dbConnection, callback);
            }

            function checkUserExistsInDb(userExists, callback) {
                if (userExists) {
                    logger.log("info", "User " + data.username + " tries to register with already assigned username");
                    socket.emit("register user", {err: 1, result: "username assigned"});
                    callback("user exists");
                } else {
                    callback();
                }
            }

            function createUserInDb(callback) {
                auth.hashPassword(data.password, function (err, hashedPw) {
                    if (err) {
                        callback(err);
                    }
                    db.addUser(data.username, hashedPw, dbConnection, function (err, user_id) {
                        callback(err, user_id);
                    });
                });
            }

            runInSeries([
                db.createConnection,
                function (con, done, cb) {
                    dbConnection = con;
                    dbDone = done;
                    cb();
                },
                userExistsInDb,
                checkUserExistsInDb,
                createUserInDb,
                function (_user_id, cb) {
                    user_id = _user_id;
                    generateToken(_user_id, cb);
                },
                function (token, cb) {
                    db.storeToken(user_id, token, dbConnection, cb);
                }
            ], function (err) {
                dbDone();
                if (!err) {
                    logger.log("info", "register new user " + data.username);
                    socket.emit("register user", {err: err, result: user_id});
                }
            });
        }

        function loginUser(data) {
            var dbConnection;
            var dbDone;
            var user_id;

            function userExistsInDb(callback) {
                db.userExists(data.username, dbConnection, function (err, user_id) {
                    if (user_id === 0) {
                        callback("user not exists");
                        logger.log("info", "unregistered user tries to login");
                        socket.emit("login user", {err: 1, result: "unknown user"});
                    } else {
                        callback(err, user_id);
                    }
                });
            }

            function comparePasswords(hashedPwFromDb, callback) {
                bcrypt.compare(data.password, hashedPwFromDb, function (err, result) {
                    if (result) {
                        logger.log("info", "user " + data.username + " is logging in");
                        socket.emit("login user", {err: err, result: user_id});
                        callback();
                    } else {
                        logger.log("info", "user " + data.username + " has wrong password");
                        socket.emit("login user", {err: 1, result: "wrong password"});
                        callback("wrong password");
                    }
                });
            }

            runInSeries([
                db.createConnection,
                function (con, done, cb) {
                    dbConnection = con;
                    dbDone = done;
                    cb();
                },
                userExistsInDb,
                function (_user_id, cb) {
                    user_id = _user_id;
                    db.getPassword(_user_id, dbConnection, cb);
                },
                comparePasswords,
                function (cb) {
                    generateToken(user_id, cb);
                },
                function (hashedToken, cb) {
                    db.storeToken(user_id, hashedToken, dbConnection, cb);
                },
                function (ignore, cb) {
                    getAndSendUserRoles(user_id, db, dbConnection, cb);
                }
            ], function (err) {
                dbDone();
                if (err !== "user not exists" && err !== "wrong password" && err) {
                    logger.log("warn", "Error: " + err);
                }
            });
        }

        function loginToken(token) {
            var dbConnection;
            var dbDone;
            var user_id;

            function checkVerification(verifiedJWT, callback) {
                user_id = verifiedJWT.body.sub;
                callback();
            }

            function compareTokens(hashedToken, callback) {
                bcrypt.compare(token, hashedToken, function (err, result) {
                    if (result) {
                        logger.log("info", "User with id " + user_id + " logging in with token");
                        socket.emit("login token", {err: 0, result: user_id});
                    } else {
                        logger.log("warning", "token mismatch");
                        socket.emit("login token", {err: 1, result: "token mismatch"});
                    }
                    callback(err);
                });
            }

            runInSeries([
                function (cb) {
                    nJwt.verify(token, signingKey, cb);
                },
                checkVerification,
                db.createConnection,
                function (con, done, cb) {
                    dbConnection = con;
                    dbDone = done;
                    cb();
                },
                function (cb) {
                    db.getToken(user_id, dbConnection, cb);
                },
                compareTokens,
                function (cb) {
                    generateToken(user_id, cb);
                },
                function (hashedToken, cb) {
                    db.storeToken(user_id, hashedToken, dbConnection, cb);
                },
                function (ignore, cb) {
                    getAndSendUserRoles(user_id, db, dbConnection, cb);
                }
            ], function (err) {
                dbDone();
                if (err === "token invalid") {
                } else if (err === "token not found") {
                    logger.log("warn", err);
                    socket.emit("login token", {err: 1, result: "token invalid"});
                } else if (err === "JwtParseError: Jwt cannot be parsed") {
                    logger.log("warn", err);
                    socket.emit("login token", {err: 1, result: "token invalid"});
                } else if (err) {
                    logger.log("warn", "Error: " + err);
                }
            });
        }

        socket.on("register user", registerUser);
        socket.on("login user", loginUser);
        socket.on("login token", loginToken);
    }

    auth.verifyUser = function (token, callback) {
        var dbDone;
        var dbConnection;
        var user;
        var error = "user not verified";

        function checkVerification(verifiedJWT, callback) {
            user = verifiedJWT.body.sub;
            callback();
        }

        function compareTokens(hashedToken, callback) {
            bcrypt.compare(token, hashedToken, function (err, result) {
                if (result) {
                    logger.log("info", "User " + user + " verified");
                    callback(err);
                } else {
                    logger.log("warning", "token mismatch");
                    if (err) {
                        callback(err);
                    } else {
                        callback("token mismatch");
                    }
                }
            });
        }

        var cached_user_id = auth.tokenCache[token];
        if (cached_user_id === undefined) {
            runInSeries([
                function (cb) {
                    nJwt.verify(token, signingKey, cb);
                },
                checkVerification,
                db.createConnection,
                function (con, done, cb) {
                    dbConnection = con;
                    dbDone = done;
                    cb();
                },
                function (cb) {
                    db.getToken(user, dbConnection, cb);
                },
                compareTokens
            ], function (err) {
                if (dbDone) {
                    dbDone();
                }
                if (err) {
                    logger.log("warn", err);
                } else {
                    error = "";
                }
                callback(error, user);
            });
        } else {
            callback(false, cached_user_id);
        }
    };

    // verify that user exists and it has the role "admin"
    auth.verifyAdmin = function (token, callback) {
        var user_id;
        var dbDone;
        var isAdmin = false;
        var i;

        runInSeries([
            function (cb) {
                auth.verifyUser(token, cb);
            },
            function (_user_id, cb) {
                user_id = _user_id;
                db.createConnection(cb);
            },
            function (con, done, cb) {
                dbDone = done;
                db.getUserRoles(user_id, con, cb);
            }
        ], function (err, roles) {
            dbDone();
            if (err) {
                logger.log("warn", err);
            }

            for (i = 0; i < roles.length; i += 1) {
                if (roles[i].role === "admin") {
                    err = false;
                    isAdmin = true;
                    break;
                }
            }
            callback(err, isAdmin);
        });
    };

    auth.isAdmin = function (user_id, callback) {
        var dbDone;
        var isAdmin = false;
        var i;

        runInSeries([
            function (cb) {
                db.createConnection(cb);
            },
            function (con, done, cb) {
                dbDone = done;
                db.getUserRoles(user_id, con, cb);
            }
        ], function (err, roles) {
            dbDone();
            for (i = 0; i < roles.length; i += 1) {
                if (roles[i].role === "admin") {
                    err = false;
                    isAdmin = true;
                    break;
                }
            }
            callback(err, isAdmin);
        });
    };

    io.on("connection", listen);

    return auth;
};
