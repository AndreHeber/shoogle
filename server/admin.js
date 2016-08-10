var runInSeries = require('async-waterfall');

module.exports = function (io, db, logger, auth, commandChains) {

    function ifIsAdmin (user_id_from_token, data, next) {
        auth.isAdmin(user_id_from_token, (err, isAdmin) => {
            if (isAdmin)  next(null, true);
            else if (err) next(err, result);
            else          next(1, "Operation not allowed!");
        });
    }

    function ifSelfOrAdmin (user_id_from_token, data, next) {
        if (user_id_from_token === data.user_id)
            next(null, true);
        else
            ifIsAdmin(user_id_from_token, data, next);
    }

    commandChains.add({
        command: 'get all users',
        verifyUser: auth.verifyUser,
        isAllowed: ifIsAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => { db.query('select user_id, username from users;', [], next); },
        prepareDataForTransmit: (result, next) => {
            var users = [];
            for (i=0; i < result.rows.length; i++)
                users.push({id: result.rows[i].user_id, name: result.rows[i].username});
            next(null, users);
        }
    });

    commandChains.add({
        command: 'get locations',
        verifyUser: auth.verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {db.query('select location_id, locationname, latitude, longitude from locations where user_id = $1;', [data.user_id], next); },
        prepareDataForTransmit: (result, next) => {
            var locations = [];
            for (i=0; i<result.rows.length; i++)
                locations.push({
                    id: result.rows[i].location_id,
                    name: result.rows[i].locationname,
                    latitude: result.rows[i].latitude,
                    longitude: result.rows[i].longitude
                });
            next(null, locations);
        }
    });

    commandChains.add({
        command: 'get items',
        verifyUser: auth.verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {
            db.query('select item_id, itemname, itemdescription, itemprice from items where location_id = $1', [data.location_id], next);
        },
        prepareDataForTransmit: (result, next) => {
            var items = [];
            for (i=0; i<result.rows.length; i++)
                items.push({
                    id: result.rows[i].item_id,
                    name: result.rows[i].itemname,
                    description: result.rows[i].itemdescription,
                    price: result.rows[i].itemprice
                });
            next(null, items);
        }
    });

    commandChains.add({
        command: 'add location',
        verifyUser: auth.verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {
            var sql = 'insert into locations (user_id, locationname, latitude, longitude) values ($1, $2, $3, $4) returning location_id;' 
            db.query(sql, [data.user_id, data.location.name, data.location.latitude, data.location.longitude], next);
        },
        prepareDataForTransmit: (result, next) => { next(null, result.rows[0].location_id); }
    });

    commandChains.add({
        command: 'add item',
        verifyUser: auth.verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {
            var sql = "insert into items (user_id, location_id, itemname, itemdescription, itemprice, searchvector) values " +
                        "($1, $2, $3, $4, $5, setweight(to_tsvector('english', $3), 'B') || to_tsvector('english', $4)) returning item_id;";
            db.query(sql, [data.user_id, data.location_id, data.item.name, data.item.description, data.item.price], next);
        },
        prepareDataForTransmit: (result, next) => { next(null, result.rows[0].item_id); }
    });

    commandChains.add({
        command: 'edit user',
        verifyUser: auth.verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {
            var sql = 'update users set username = $1, password = $2 where user_id = $3;';
            db.query(sql, [data.name, data.password, data.user_id], next);
        },
        prepareDataForTransmit: (result, next) => { next(null, result); }
    });

    commandChains.add({
        command: 'edit location',
        verifyUser: auth.verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {
            var sql = 'update locations set locationname = $1, latitude = $2, longitude = $3 where location_id = $4;';
            db.query(sql, [data.location.name, data.location.latitude, data.location.longitude, data.location.id], next);
        },
        prepareDataForTransmit: (result, next) => { next(null, result); }
    });

    commandChains.add({
        command: 'edit item',
        verifyUser: auth.verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {
            var sql = "update items set itemname = $1, itemdescription = $2, itemprice = $3, " + 
                        "setweight(to_tsvector('english', $1), 'B') || to_tsvector('english', $2) where item_id = $4;";
            db.query(sql, [data.item.name, data.item.description, data.item.price, data.item.id], next);
        },
        prepareDataForTransmit: (result, next) => { next(null, result); }
    });

    commandChains.add({
        command: 'delete user',
        verifyUser: auth.verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {
            var rollback = (err, result) => { db.query('ROLLBACK', next(err, result)); };
            db.query('BEGIN', (err) => {
                if (err) rollback(err);
                else {
                    db.query('delete from user_role where user_id = $1;', [data.user_id], (err, result) => {
                        if (err) rollback(err, result);
                        else {
                            db.query('delete from users where user_id = $1;', [data.user_id], (err, result) => {
                                if (err) rollback(err, result);
                                else db.query('COMMIT', next);
                            });
                        }
                    });
                }
            })
        },
        prepareDataForTransmit: (result, next) => { next(null, result); }
    });

    commandChains.add({
        command: 'delete location',
        verifyUser: auth.verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => { db.query('delete from locations where location_id = $1;', [data.location_id], next); },
        prepareDataForTransmit: (result, next) => { next(null, result); }
    });

    commandChains.add({
        command: 'delete item',
        verifyUser: auth.verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {db.query('delete from items where item_id = $1;', [data.id], next); },
        prepareDataForTransmit: (result, next) => { next(null, result); }
    });

    commandChains.add({
        command: 'get all roles',
        verifyUser: auth.verifyUser,
        isAllowed: ifIsAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {db.query('select role_id, role from roles;', [], next); },
        prepareDataForTransmit: (result, next) => {
            var roles = [];
            for (var i = 0; i < result.rows.length; i++)
                roles.push({id: result.rows[i].role_id, role: result.rows[i].role});
            next(null, roles);
        }
    });

    commandChains.add({
        command: 'get roles',
        verifyUser: auth.verifyUser,
        isAllowed: ifSelfOrAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {
            var sql = 'select roles.role_id, role from roles ' +
                        'inner join user_role on (user_role.role_id = roles.role_id) ' +
                        'where user_id = $1;'
            db.query(sql, [data.user_id], next);
        },
        prepareDataForTransmit: (result, next) => {
            var roles = [];
            for (var i = 0; i < result.rows.length; i++)
                roles.push({id: result.rows[i].role_id, role: result.rows[i].role});
            next(null, roles);
        }
    });

    commandChains.add({
        command: 'edit roles',
        verifyUser: auth.verifyUser,
        isAllowed: ifIsAdmin,
        checkData: (data, next) => { next(null, true); },
        prepareDataForDb: (data, next) => { next(null, data); },
        dbCommand: (db, data, next) => {
            db.query('delete from user_role where user_id = $1;', [data.user_id], (err, result) => {
                function insert (loop) {
                    if (loop < data.role_ids.length) {
                        db.query('insert into user_role (user_id, role_id) values ($1, $2);', [data.user_id, data.role_ids[loop]], (err, _result) => {
                            if (err) next(err, result);
                            insert(loop + 1);
                        });
                    }
                }
                insert(0);
                next(err, result);
            });
        },
        prepareDataForTransmit: (result, next) => { next(null, result); }
    });
}