var pg = require('pg');

module.exports = function (logger, ready) {
    var dbThreadPool;

    function init() {
        dbThreadPool = new pg.Pool({
            user: 'vagrant', //env var: PGUSER
            database: 'test', //env var: PGDATABASE
            password: 'vagrant', //env var: PGPASSWORD
            port: 5432, //env var: PGPORT
            max: 10, // max number of clients in the pool
            idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
        });

        var createDatabaseTables = [
            'create table if not exists users (' +
            'user_id serial primary key,' +
            'username text not null,' +
            'password text not null,' +
            'token text not null,' +
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
            'itemprice integer not null' +
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

        function runQuery(client, i) {
            if (i < createDatabaseTables.length) {
                client.query(createDatabaseTables[i], [], (err, result) => { if (err) throw err; });
                runQuery(client, i + 1);
            }
            else
                ready();
        }

        dbThreadPool.connect(function (err, client, done) {
            runQuery(client, 0);
        });
    }
    init();

    dbThreadPool.createConnection = function (callback) {
        dbThreadPool.connect((err, db, done) => {
            callback(err, db, done);
        });
    }

    dbThreadPool.addUser = function (user, hash, token, db, callback) {
        db.query('insert into users (username, password, token) values ($1, $2, $3) returning user_id;', [user, hash, token], (err, result) => {
            callback(err, result.rows[0]);
        });
    }

    dbThreadPool.getUser = function (username, db, callback) {
        db.query('select * from users where username = $1;', [username], (err, result) => {
            callback(err, result.rows[0]);
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
        db.query('select count(*) from users where username = $1;', [user], (err, result) => {
            var exists = parseInt(result.rows[0].count);
            callback(err, exists);
        });
    }

    dbThreadPool.getPassword = function (user, db, callback) {
        db.query('select password from users where username = $1;', [user], (err, result) => {
            callback(err, result.rows[0].password);
        });
    }

    dbThreadPool.getToken = function (user, db, callback) {
        db.query('select token from users where username = $1;', [user], (err, result) => {
            if (typeof result.rows[0] === 'undefined') callback('token not found');
            else callback(err, result.rows[0].token);
        });
    }

    dbThreadPool.storeToken = function (user, token, db, callback) {
        db.query('update users set token = $1 where username = $2;', [token, user], (err, result) => {
            callback(err, result.rowCount);
        });
    }

    dbThreadPool.addLocation = function (user_id, location, db, callback) {
        var sql = 'insert into locations (user_id, locationname, latitude, longitude) values ($1, $2, $3, $4) returning location_id;' 
        db.query(sql, [user_id, location.name, location.latitude, location.longitude], (err, result) => {
            callback(err, result.rows[0]);
        });
    }

    // dbThreadPool.getLocations = function (username, db, callback) {
    //     var sql = 'select location_id, locationname, latitude, longitude from locations where user_id = ' +
    //               '(select user_id from users where username = $1);';
    //     db.query(sql, [username], (err, result) => {
    //         var locations = [];
    //         for (i=0; i<result.rows.length; i++)
    //             locations.push({
    //                 id: result.rows[i].location_id,
    //                 name: result.rows[i].locationname,
    //                 latitude: result.rows[i].latitude,
    //                 longitude: result.rows[i].longitude
    //             });
    //         callback(err, locations);
    //     });
    // }

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
        var sql = 'insert into items (user_id, location_id, itemname, itemdescription, itemprice) values ($1, $2, $3, $4, $5) returning item_id;';
        db.query(sql, [user_id, location_id, item.name, item.description, item.price], (err, result) => {
            callback(err, result.rows[0]);
        });
    }

    // dbThreadPool.getItems = function (username, locationname, db, callback) {
    //     db.query('select user_id from users where username = $1;', [username], (err, result) => {
    //         var userId = result.rows[0].user_id;
    //         var sql = 'select item_id, itemname, itemdescription, itemprice from items where user_id = $1 and location_id = ' +
    //                   '(select location_id from locations where user_id = $1 and locationname = $2);';
    //         db.query(sql, [userId, locationname], (err, result) => {
    //             var items = [];
    // 
    //             for (i=0; i<result.rows.length; i++)
    //                 items.push({
    //                     id: result.rows[i].item_id,
    //                     name: result.rows[i].itemname,
    //                     description: result.rows[i].itemdescription,
    //                     price: result.rows[i].itemprice
    //                 });
    //             callback(err, items);
    //         });
    //     });
    // }

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

    dbThreadPool.getUserRoles = function (username, db, callback) {
        var sql = 'select role from roles ' +
            'inner join user_role on (user_role.role_id = roles.role_id) ' +
            'inner join users on (users.user_id = user_role.user_id) ' +
            'where username = $1;'
        db.query(sql, [username], (err, result) => {
            var roles = [];

            if (err) throw err;
            if (typeof result.rows[0] === 'undefined') roles = ['user'];
            else {
                for (var i = 0; i < result.rows.length; i++)
                    roles.push(result.rows[i].role);
            }
            callback(err, roles);
        });
    }

    return dbThreadPool;
}
