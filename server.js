/*

Spectrum.io

Communication app built on AT&T's Alpha-APIs.

Built by &yet (http://andyet.net) for the AT&T Foundry.

*/
/*global console*/

// requirements
var express = require('express'),
    util = require('util'),
    fs = require('fs'),
    RedisStore = require('connect-redis')(express),
    path = require('path'),
    attAuth = require('att-express-auth'),
    stitch = require('stitch'),
    postageApp = require('./postageApp'),
    uuid = require('node-uuid'),
    userGateway = require('./users'),
    _ = require('underscore'),
    request = require('request'),
    config = require('getconfig');

// init the app
var app = module.exports = express.createServer();

// configure dev and producion environments
app.configure('development', function () {
    app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});
app.configure('production', function () {
    app.use(express.errorHandler());
});

// package up our clientside app
var clientPackage = require('./clientPackage');

// configure the app
app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: config.sessionSecret, store: new RedisStore({db: config.redisDB})}));
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express['static'](__dirname + '/public'));
    app.use(attAuth.middleware({
        app: app,
        clientId: config.clientId,
        clientSecret: config.secret,
        scopes: ['profile', 'addessbook', 'locker', 'messages', 'geo', 'webrtc'],
        redirectUrl: config.baseUrl
    }));
    app.get('/app.js', clientPackage.createServer());
});


// this convenience method lets us define an explicit status code
// and handles the attempt to parse (in case we dont get JSON)
function wrapCallback(expectedCode, cb) {
    return function (err, res, body) {
        var parsed;
        try { parsed = JSON.parse(body); } catch (e) {}

        if (err) {
            cb(new Error("There was a problem making the request"), null);
        } else if (!parsed) {
            console.log('did not get JSON:', body);
            cb(new Error("Failed to parse result as JSON"), null);
        } else if (res.statusCode !== expectedCode) {
            cb(new Error("Failed to parse result as JSON"), null);
        } else {
            // everything worked, this is what we want
            cb(null, parsed);
        }
    };
}

function trimUrl(url) {
    return url.split('/').slice(2).join('/');
}

app.get('/video-invite', function (req, res) {
    res.render('video-invite', {layout: false});
});

app.get('/authproxy/*', function (req, res) {
    req.pipe(request('https://auth.tfoundry.com/' + trimUrl(req.url))).pipe(res);
});
app.all('/uploadproxy/*', function (req, res) {
    req.pipe(request('https://api.tfoundry.com/a1/' + trimUrl(req.url))).pipe(res);
});
app.all('/apiproxy/*', function (req, res) {
    var url = 'https://api.tfoundry.com/' + trimUrl(req.url);
    req.pipe(request({
        url: url,
        json: req.body,
        method: req.method
    })).pipe(res);
});

app.post('/share/:fileId', function (req, res) {
    if (!req.query.email) {
        res.send({error: "must send email address in query string"}, 400);
    } else {
        request({
            method: 'get',
            url: 'https://api.tfoundry.com/a1/locker/object/newshare/' + req.params.fileId,
            qs: {
                access_token: req.query.access_token
            },
            json: true
        }, function (err, response, body) {
            postageApp.sendFileShare('https://api.tfoundry.com/a1/locker/share/' + body.share_id, req.query.email, function (err) {
                console.log('postagapp callback', arguments);
                if (err) {
                    res.send({error: "something wen't wrong"}, 400);
                } else {
                    res.send({error: false}, 200);
                }
            });
        });
    }
});

app.get(/^(\/(contacts|files|messages|apps|video|static|location))|^\/$/, function (req, res) {
    var token = req.session.accessToken;
    if (token) {
        // we just transport the token this way, then store it clientside
        // hence the short expiration
        res.cookie('t', token, {expires: new Date(Date.now() + 300000)});  
        req.session.accessToken = '';
        req.session.save();
    }
    res.render(__dirname + '/templates/index.jade',  {layout: false});
});

// this is our post listener for callbacks when using the mobile binding flow
app.post('/auth/callback', function (req, res) {
    var state = req.headers.state,
        token = req.headers['access-token'];

    // look up our socket.io connection by our "state" variable
    var clientConnection = state && io.sockets.sockets[state];

    if (clientConnection) {
        console.log('emitting token', token);
        clientConnection.emit('token', token);
    } else {
        console.log('could not find client connection');
    }
});

// our socket.io handling for auth
var io = require('socket.io').listen(app);

// our lookup for active connections
var users = {};

function emitToRoom(roomId, eventType, payload, cb) {
    userGateway.getUsersInRoom(roomId, function (err, users) {
        (users || []).forEach(function (user) {
            console.log('user', user, eventType, payload);
            emitToUser(user, eventType, payload);
        });
        if (cb) cb();
    });
}

function emitToUser(userId, eventType, payload) {
    (users[userId] || []).forEach(function (client) {
        client.emit(eventType, payload);
    });
}

io.sockets.on('connection', function (client) {
    client.on('login', function (token, cb) {
        request({
            url: 'https://auth.tfoundry.com/me.json',
            json: true,
            qs: {
                access_token: token
            }
        }, function (err, res, body) {
            if (res.statusCode === 200) {
                var user = body.phone_number;
                console.log('USER:', user);
                userGateway.goOnline(user, function () {
                    // make sure it exits
                    if (!users[user]) users[user] = []; 
                    users[user].push(client);
                    client.user = user;
                    client.broadcast.emit('online', user);

                    userGateway.getRooms(client.user, function (err, res) {
                        var info = {
                            rooms: res,
                            user: client.user
                        };
                        if (cb) {
                            cb(info);
                        } else {
                            client.emit('ready', info);
                        }
                    });

                    userGateway.getOnline(function (err, onlineUsers) {
                        (onlineUsers || []).forEach(function (user) {
                            client.emit('online', user);
                        });
                    });
                });
            } else {
                cb && cb('failed');
            }
        });
    });

    client.on('getRooms', function (cb) {
        userGateway.getCurrentRoomsForUser(client.user, cb);
    });

    client.on('disconnect', function () {
        userGateway.goOffline(client.user);
        users[client.user] = _.without(users[client.user], client);
        client.broadcast.emit('offline', client.user);
    });

    client.on('sendDirectChat', function (details) {
        userGateway.sendDirectChat(client.user, details.to, details.message, function (err, messageObj) {
            emitToUser(client.user, 'directChat', messageObj);
            emitToUser(details.to, 'directChat', messageObj);
        });
    });

    client.on('getDirectChatMessages', function (id, cb) {
        userGateway.getDirectChatMessages(client.id, id, cb); 
    });

    client.on('createRoom', function (topic, cb) {
        if (!client.user) {
            cb && cb('You must be logged in to create rooms.');
        } else {
            userGateway.createRoom(topic, function (err, roomDetails) {
                userGateway.joinRoom(client.user, roomDetails.id, function (err, roomObj) {
                    emitToUser(client.user, 'joinedRoom', roomObj);
                    if (cb) cb(roomObj);
                });
            });
        }
    });

    client.on('leaveRoom', function (id) {
        // we emit this first so user calling it will get it as well
        emitToRoom(id, 'leftRoom', {user: client.user, room: id}, function () {
            userGateway.leaveRoom(client.user, id);
        });
    });

    client.on('addUserToRoom', function (args) {
        console.log('here', args);
        if (!args.room || !args.user) return;
        userGateway.joinRoom(args.user, args.room, function (err, room) {
            emitToRoom(args.room, 'joinedRoom', room);
        });
    });

    client.on('sendMessage', function (message, cb) {
        userGateway.sendMessage(client.user, message.room, message.body, function (err, messageObj) {
            console.log('messageOBj', message.room, 'message', messageObj);
            emitToRoom(message.room, 'message', messageObj);
        });
    });

    client.on('setRoomTopic', function (obj, cb) {
        userGateway.setRoomTopic(obj.id, obj.topic, function (err, details) {
            if (!err) emitToRoom(obj.id, 'newTopic', details);
            if (cb) cb(details);
        });
    });
});

io.sockets.on('connection', function (client) {
    client.on('phone', function (phoneNumber) {
        console.log('got a phone number', phoneNumber);
        
        // we pass through the currently connected client id
        // so we can use that to look up the user when we get 
        // the callback.
        request.post({
            //url: 'https://alpha-auth.stage.tfoundry.com/oauth/bind/authorize/sms/' + phoneNumber,
            url: 'https://auth.tfoundry.com/oauth/bind/authorize/sms/' + phoneNumber,
            form: {
                scope: 'profile,addressbook,locker,messages,geo',
                response_type: 'token',
                client_id: config.clientId, //'b1cbf81f04532c6fdb176287eaf214cd',
                state: client.id
            }
        }, function (err, req, body) {
            console.log('response', err, req && req.statusCode, body);
        });
    });
});

// start listening for requests
app.listen(config.httpPort);
console.log('Spectrum App listening on port %d in %s mode', config.httpPort, app.settings.env);
