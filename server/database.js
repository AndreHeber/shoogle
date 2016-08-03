var pg = require('pg');

module.exports = function (logger, ready) {
    var dbThreadPool;

    var log = function (msg) {
      dbThreadPool.messages.push(msg)
    }

    function init() {
        dbThreadPool = new pg.Pool({
            user: 'vagrant', //env var: PGUSER
            database: 'test', //env var: PGDATABASE
            password: 'vagrant', //env var: PGPASSWORD
            port: 5432, //env var: PGPORT
            max: 8, // max number of clients in the pool
            idleTimeoutMillis: 1000, // how long a client is allowed to remain idle before being closed
            log: log
        });
        dbThreadPool.messages = [];

        var createDatabaseTables = [
            'create table if not exists users (' +
            'user_id serial primary key,' +
            'username text not null,' +
            'password text not null,' +
            'token text,' +
            'userpicture text' +
            ');',
            'create table if not exists roles (' +
            'role_id serial primary key,' +
            'role text not null,' +
            'roledescription text' +
            ');',
            'create table if not exists user_role (' +
            'user_id integer references users (user_id),' +
            'role_id integer references roles (role_id),' +
            'constraint user_role_pkey primary key (user_id, role_id)' +
            ');',
            'create table if not exists locations (' +
            'location_id serial primary key,' +
            'user_id integer references users (user_id),' +
            'locationname text not null,' +
            'latitude double precision not null,' +
            'longitude double precision not null' +
            ');',
            'create table if not exists items (' +
            'item_id serial primary key,' +
            'user_id integer references users (user_id),' +
            'location_id integer references locations (location_id),' +
            'itemname text not null,' +
            'itemdescription text not null,' +
            'itempicture text,' +
            'itemprice integer not null,' +
            'searchvector tsvector not null' +
            ');',
            'create table if not exists ratings (' +
            'rating_id serial primary key,' +
            'from_user_id integer references users (user_id),' +
            'to_user_id integer references users (user_id),' +
            'rating integer,' +
            'ratingdescription text' +
            ');',
            'create table if not exists messages (' +
            'message_id serial primary key,' +
            'from_user_id integer references users (user_id),' +
            'to_user_id integer references users (user_id),' +
            'messagetitle text,' +
            'messagedescription text' +
            ');'
        ];

        function runQuery(client, i, done) {
            if (i < createDatabaseTables.length) {
                client.query(createDatabaseTables[i], [], (err, result) => { if (err) throw err; });
                runQuery(client, i + 1, done);
            } else {
                done();
                ready();
            }
        }

        dbThreadPool.connect(function (err, client, done) {
            runQuery(client, 0, done);
        });
    }
    init();

    dbThreadPool.createConnection = function (callback) {
        dbThreadPool.connect((err, db, done) => {
            callback(err, db, done);
        });
    }

    dbThreadPool.on('error', (err, client) => {
        console.error('idle client error', err.message, err.stack);
    });

    dbThreadPool.addUser = function (user, hash, db, callback) {
        db.query('insert into users (username, password) values ($1, $2) returning user_id;', [user, hash], (err, result) => {
            var user_id = result.rows[0].user_id;
            db.query('insert into user_role (user_id, role_id) values ($1, (select role_id from roles where role = $2));', [user_id, 'user'], (err, result) => {
                callback(err, user_id); 
            });
        });
    }

    dbThreadPool.editUser = function (user, db, callback) {
        var sql = 'update users set username = $1, password = $2 where user_id = $3;';
        db.query(sql, [user.name, user.password, user.id], (err, result) => {
            callback(err);
        });
    }

    dbThreadPool.deleteUser = function (user_id, db, callback) {
        db.query('delete from user_role where user_id = $1;', [user_id], (err, result) => {
            db.query('delete from users where user_id = $1;', [user_id], (err, result) => {
                callback(err);
            });
        });
    }

    dbThreadPool.getUsers = function (db, callback) {
        db.query('select user_id, username from users;', [], (err, result) => {
            var users = [];

            for (i=0; i<result.rows.length; i++)
                users.push({id: result.rows[i].user_id, name: result.rows[i].username});
            
            callback(err, users);
        });
    }

    dbThreadPool.userExists = function (user, db, callback) {
        db.query('select user_id from users where username = $1;', [user], (err, result) => {
            var userExists = result.rowCount;
            if (userExists) callback(err, result.rows[0].user_id);
            else            callback(err, userExists);
        });
    }

    dbThreadPool.getPassword = function (user_id, db, callback) {
        db.query('select password from users where user_id = $1;', [user_id], (err, result) => {
            callback(err, result.rows[0].password);
        });
    }

    dbThreadPool.getToken = function (user_id, db, callback) {
        db.query('select token from users where user_id = $1;', [user_id], (err, result) => {
            if ( (typeof result === 'undefined')
              || (typeof result.rows[0] === 'undefined') ) {
                callback('token not found');
            } else {
                callback(err, result.rows[0].token);
            }
        });
    }

    dbThreadPool.storeToken = function (user_id, token, db, callback) {
        db.query('update users set token = $1 where user_id = $2;', [token, user_id], (err, result) => {
            callback(err, result.rowCount);
        });
    }

    dbThreadPool.addLocation = function (user_id, location, db, callback) {
        var sql = 'insert into locations (user_id, locationname, latitude, longitude) values ($1, $2, $3, $4) returning location_id;' 
        db.query(sql, [user_id, location.name, location.latitude, location.longitude], (err, result) => {
            callback(err, result.rows[0]);
        });
    }

    dbThreadPool.editLocation = function (location, db, callback) {
        var sql = 'update locations set locationname = $1, latitude = $2, longitude = $3 where location_id = $4;';
        db.query(sql, [location.name, location.latitude, location.longitude, location.id], (err, result) => {
            callback(err);
        });
    }

    dbThreadPool.deleteLocation = function (location_id, db, callback) {
        db.query('delete from locations where location_id = $1;', [location_id], (err, result) => {
            callback(err);
        });
    }

    dbThreadPool.getLocations = function (user_id, db, callback) {
        db.query('select location_id, locationname, latitude, longitude from locations where user_id = $1;', [user_id], (err, result) => {
            var locations = [];
            for (i=0; i<result.rows.length; i++)
                locations.push({
                    id: result.rows[i].location_id,
                    name: result.rows[i].locationname,
                    latitude: result.rows[i].latitude,
                    longitude: result.rows[i].longitude
                });
            callback(err, locations);
        });
    }

    dbThreadPool.addItem = function (user_id, location_id, item, db, callback) {
        var sql = "insert into items (user_id, location_id, itemname, itemdescription, itemprice, searchvector) values " +
                  "($1, $2, $3, $4, $5, setweight(to_tsvector('english', $3), 'B') || to_tsvector('english', $4)) returning item_id;";
        db.query(sql, [user_id, location_id, item.name, item.description, item.price], (err, result) => {
            callback(err, result.rows[0]);
        });
    }

    dbThreadPool.editItem = function (item, db, callback) {
        var sql = "update items set itemname = $1, itemdescription = $2, itemprice = $3, " + 
                  "setweight(to_tsvector('english', $1), 'B') || to_tsvector('english', $2) where item_id = $4;";
        db.query(sql, [item.name, item.description, item.price, item.id], (err, result) => {
            callback(err);
        });
    }

    dbThreadPool.deleteItem = function (item_id, db, callback) {
        db.query('delete from items where item_id = $1;', [item_id], (err, result) => {
            callback(err);
        });
    }

    dbThreadPool.getItems = function (location_id, db, callback) {
        db.query('select item_id, itemname, itemdescription, itemprice from items where location_id = $1', [location_id], (err, result) => {
            var items = [];

            for (i=0; i<result.rows.length; i++)
                items.push({
                    id: result.rows[i].item_id,
                    name: result.rows[i].itemname,
                    description: result.rows[i].itemdescription,
                    price: result.rows[i].itemprice
                });
            callback(err, items);
        });
    }

    dbThreadPool.searchItem = function (item, db, callback) {
        //db.query('select *')
    }

    dbThreadPool.getUserRoles = function (user_id, db, callback) {
        var sql = 'select roles.role_id, role from roles ' +
            'inner join user_role on (user_role.role_id = roles.role_id) ' +
            'where user_id = $1;'
        db.query(sql, [user_id], (err, result) => {
            var roles = [];

            if (err) throw err;
            else {
                for (var i = 0; i < result.rows.length; i++)
                    roles.push({id: result.rows[i].role_id, role: result.rows[i].role});
            }
            callback(err, roles);
        });
    }

    dbThreadPool.getAllRoles = function (db, callback) {
        db.query('select role_id, role from roles;', [], (err, result) => {
            var roles = [];

            for (var i = 0; i < result.rows.length; i++)
                roles.push({id: result.rows[i].role_id, role: result.rows[i].role});

            callback(err, roles);
        });
    }

    dbThreadPool.editRoles = function(user_id, role_ids, db, callback) {
        db.query('delete from user_role where user_id = $1;', [user_id], (err, result) => {

            function insert (loop) {
                if (loop < role_ids.length) {
                    db.query('insert into user_role (user_id, role_id) values ($1, $2);', [user_id, role_ids[loop]], (err) => {
                        if (err) throw err;
                        insert(loop + 1);
                    });
                }
            }

            insert(0);
            callback(err);
        });
    }

    dbThreadPool.suggestItems = function(item, db, callback) {
        var sql = "select itemname as item, ts_rank(searchvector, keywords, 8) as rank from items, to_tsquery($1) keywords " +
                  "where keywords @@ searchvector order by rank desc";
        db.query(sql, [item], (err, result) => {
            var items = [];

            if (err) throw err;
            for (i=0; i<result.rows.length; i++) {
                items.push(result.rows[i].item);
            }

            callback(items);
        });
    }

    return dbThreadPool;
}
