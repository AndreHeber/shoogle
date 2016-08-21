module.exports = function (commandChains) {
    "use strict";

    function verifyUser(token, next) {
        this.auth.verifyUser(token, next);
    }

    function ifIsAdmin(user_id_from_token, data, next) {
        this.auth.isAdmin(user_id_from_token, function (err, isAdmin) {
            if (isAdmin) {
                next(null, true);
            } else if (err) {
                next(err);
            } else {
                next(1, "Operation not allowed!");
            }
        });
    }

    function ifSelfOrAdmin(user_id_from_token, data, next) {
        if (user_id_from_token === data.user_id) {
            next(null, true);
        } else {
            ifIsAdmin.call(this, user_id_from_token, data, next);
        }
    }

    /**
     * @p
     */
    commandChains.add({
        command: "get all users",
        verifyUser: verifyUser,
        isAllowed: ifIsAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            db.query("select user_id, username from users;", [], next);
        },
        prepareDataForTransmit: function (result, next) {
            var i;
            var users = [];
            for (i = 0; i < result.rows.length; i += 1) {
                users.push({id: result.rows[i].user_id, name: result.rows[i].username});
            }
            next(null, users);
        }
    });

    commandChains.add({
        command: "get locations",
        verifyUser: verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            db.query("select location_id, locationname, latitude, longitude from locations where user_id = $1;", [data.user_id], next);
        },
        prepareDataForTransmit: function (result, next) {
            var i;
            var locations = [];
            for (i = 0; i < result.rows.length; i += 1) {
                locations.push({
                    id: result.rows[i].location_id,
                    name: result.rows[i].locationname,
                    latitude: result.rows[i].latitude,
                    longitude: result.rows[i].longitude
                });
            }
            next(null, locations);
        }
    });

    commandChains.add({
        command: "get items",
        verifyUser: verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            db.query("select item_id, itemname, itemdescription, itemprice from items where location_id = $1", [data.location_id], next);
        },
        prepareDataForTransmit: function (result, next) {
            var i;
            var items = [];

            for (i = 0; i < result.rows.length; i += 1) {
                items.push({
                    id: result.rows[i].item_id,
                    name: result.rows[i].itemname,
                    description: result.rows[i].itemdescription,
                    price: result.rows[i].itemprice
                });
            }

            next(null, items);
        }
    });

    commandChains.add({
        command: "add location",
        verifyUser: verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            var sql = "insert into locations (user_id, locationname, latitude, longitude) values ($1, $2, $3, $4) returning location_id;";
            db.query(sql, [data.user_id, data.location.name, data.location.latitude, data.location.longitude], next);
        },
        prepareDataForTransmit: function (result, next) {
            next(null, result.rows[0].location_id);
        }
    });

    commandChains.add({
        command: "add item",
        verifyUser: verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            var sql = "insert into items (user_id, location_id, itemname, itemdescription, itemprice, searchvector) values " +
                        "($1, $2, $3, $4, $5, setweight(to_tsvector('english', $3), 'B') || to_tsvector('english', $4)) returning item_id;";
            db.query(sql, [data.user_id, data.location_id, data.item.name, data.item.description, data.item.price], next);
        },
        prepareDataForTransmit: function (result, next) {
            next(null, result.rows[0].item_id);
        }
    });

    commandChains.add({
        command: "edit user",
        verifyUser: verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            var sql = "update users set username = $1, password = $2 where user_id = $3;";
            db.query(sql, [data.name, data.password, data.user_id], next);
        },
        prepareDataForTransmit: function (result, next) {
            next(null, result);
        }
    });

    commandChains.add({
        command: "edit location",
        verifyUser: verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            var sql = "update locations set locationname = $1, latitude = $2, longitude = $3 where location_id = $4;";
            db.query(sql, [data.location.name, data.location.latitude, data.location.longitude, data.location.id], next);
        },
        prepareDataForTransmit: function (result, next) {
            next(null, result);
        }
    });

    commandChains.add({
        command: "edit item",
        verifyUser: verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            var sql = "update items set itemname = $1, itemdescription = $2, itemprice = $3, " +
                "setweight(to_tsvector('english', $1), 'B') || to_tsvector('english', $2) where item_id = $4;";
            db.query(sql, [data.item.name, data.item.description, data.item.price, data.item.id], next);
        },
        prepareDataForTransmit: function (result, next) {
            next(null, result);
        }
    });

    commandChains.add({
        command: "delete user",
        verifyUser: verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            var rollback = function (err, result) {
                db.query("ROLLBACK", next(err, result));
            };
            db.query("BEGIN", function (err) {
                if (err) {
                    rollback(err);
                } else {
                    db.query("delete from user_role where user_id = $1;", [data.user_id], function (err, result) {
                        if (err) {
                            rollback(err, result);
                        } else {
                            db.query("delete from users where user_id = $1;", [data.user_id], function (err, result) {
                                if (err) {
                                    rollback(err, result);
                                } else {
                                    db.query("COMMIT", next);
                                }
                            });
                        }
                    });
                }
            });
        },
        prepareDataForTransmit: function (result, next) {
            next(null, result);
        }
    });

    commandChains.add({
        command: "delete location",
        verifyUser: verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            db.query("delete from locations where location_id = $1;", [data.location_id], next);
        },
        prepareDataForTransmit: function (result, next) {
            next(null, result);
        }
    });

    commandChains.add({
        command: "delete item",
        verifyUser: verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            db.query("delete from items where item_id = $1;", [data.id], next);
        },
        prepareDataForTransmit: function (result, next) {
            next(null, result);
        }
    });

    commandChains.add({
        command: "get all roles",
        verifyUser: verifyUser,
        isAllowed: ifIsAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            db.query("select role_id, role from roles;", [], next);
        },
        prepareDataForTransmit: function (result, next) {
            var roles = [];
            var i;
            for (i = 0; i < result.rows.length; i += 1) {
                roles.push({id: result.rows[i].role_id, role: result.rows[i].role});
            }
            next(null, roles);
        }
    });

    commandChains.add({
        command: "get roles",
        verifyUser: verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            var sql = "select roles.role_id, role from roles " +
                    "inner join user_role on (user_role.role_id = roles.role_id) " +
                    "where user_id = $1;";
            db.query(sql, [data.user_id], next);
        },
        prepareDataForTransmit: function (result, next) {
            var roles = [];
            var i;
            for (i = 0; i < result.rows.length; i += 1) {
                roles.push({id: result.rows[i].role_id, role: result.rows[i].role});
            }
            next(null, roles);
        }
    });

    commandChains.add({
        command: "edit roles",
        verifyUser: verifyUser,
        isAllowed: ifIsAdmin,
        checkData: function (data, next) {
            next(null, true);
        },
        prepareDataForDb: function (data, next) {
            next(null, data);
        },
        dbCommand: function (db, data, next) {
            db.query("delete from user_role where user_id = $1;", [data.user_id], function (err, result) {
                function insert(loop) {
                    if (loop < data.role_ids.length) {
                        var sql = "insert into user_role (user_id, role_id) values ($1, $2);";
                        db.query(sql, [data.user_id, data.role_ids[loop]], function (err, ignore) {
                            if (err) {
                                next(err, result);
                            }
                            insert(loop + 1);
                        });
                    }
                }
                insert(0);
                next(err, result);
            });
        },
        prepareDataForTransmit: function (result, next) {
            next(null, result);
        }
    });
};