var config = require('getconfig'),
    redis = require('redis').createClient(),
    async = require('async'),
    uuid = require('node-uuid');

// choose the right redis db, per config.
redis.select(config.redisDB);

exports.getUser = function (id, cb) {
    redis.get('user:' + id, cb);
};

exports.goOnline = function (id, cb) {
    redis.sadd('onlineusers', id, function () {
        cb();
    });
};

exports.goOffline = function (id, cb) {
    redis.srem('onlineusers', id, function () {
        if (cb) cb();
    });
};

exports.getOnline = function (cb) {
    redis.smembers('onlineusers', cb);
};

exports.createRoom = function (topic, cb) {
    var details = {
        id: uuid(),
        topic: topic
    };
    redis.sadd('rooms', details.id, function () {
        redis.set('roomdetails:' + details.id, JSON.stringify(details), function () {
            cb(null, details);
        });
    });
};

exports.getRooms = function (userId, cb) {
    var roomResult = [];
    redis.smembers('user:' + userId, function (err, rooms) {
        async.forEachSeries(rooms || [], function (roomId, loopCb) {
            exports.getRoom(roomId, function (err, roomObj) {
                roomResult.push(roomObj);
                loopCb();
            });
        }, function (err, res) {
            cb(null, roomResult);
        });
    });
};

exports.setRoomTopic = function (roomId, newTopic, cb) {
    redis.get('roomdetails:' + roomId, function (err, details) {
        if (!err) {
            details = JSON.parse(details);
            details.topic = newTopic;
            redis.set('roomdetails:' + roomId, JSON.stringify(details), function () {
                cb(null, details);
            });
        } else {
            cb(err);
        }
    });
};

exports.getKeyNameForDirectChat = function (user1Id, user2Id) {
    return 'directmessages:' + [user1Id, user2Id].sort().join(':');
};

exports.getDirectChatMessages = function (user1Id, user2Id, limit, cb) {
    var count, callback;
    if (arguments.length === 3) {
        count = 20;
        callback = limit;
    } else {
        count = Math.abs(limit);
        callback = cb;
    }
    redis.zrange(exports.getKeyNameForDirectChat(user1Id, user2Id), (count * -1), -1, function (err, arrayOfJson) {
        var result = [];
        (arrayOfJson || []).forEach(function (message) {
            result.push(JSON.parse(message));
        });
        callback(err, result);
    });
};

exports.sendDirectChat = function (from, to, message, cb) {
    var when = Date.now().toString(),
        messageObj = {
            body: message,
            from: from,
            time: when,
            to: to
        };
    redis.zadd(exports.getKeyNameForDirectChat(from, to), when, JSON.stringify(messageObj), function () {
        if (cb) cb(null, messageObj);
    });
};

exports.getRoom = function (roomId, cb) {
    var roomObj = {
        id: roomId
    };
    async.parallel([
        function (cb) {
            exports.getUsersInRoom(roomId, function (err, users) {
                roomObj.participants = users;
                cb();
            });
        },
        function (cb) {
            exports.getMessages(roomId, function (err, messages) {
                roomObj.messages = messages;
                cb();
            });
        },
        function (cb) {
            redis.get('roomdetails:' + roomId, function (err, details) {
                if (!err) {
                    roomObj.topic = JSON.parse(details).topic;
                    cb();
                } else {
                    cb(err);
                }
            });
        }
    ], function (err, res) {
        cb(null, roomObj);
    });
};

exports.getUsersInRoom = function (roomId, cb) {
    redis.smembers('rooms:' + roomId, function (err, members) {
        cb(null, members || []);
    });
};

exports.joinRoom = function (userId, roomId, cb) {
    redis.sadd('rooms:' + roomId, userId, function () {
        redis.sadd('user:' + userId, roomId, function () {
            exports.getRoom(roomId, cb);
        });
    });
};

exports.leaveRoom = function (userId, roomId, cb) {
    redis.srem('rooms:' + roomId, userId, function () {
        redis.srem('user:' + userId, roomId, function () {
            if (cb) exports.getRoom(roomId, cb);
        });
    });
};

exports.sendMessage = function (userId, roomId, message, cb) {
    var when = Date.now().toString(),
        messageObj = {
            body: message,
            from: userId,
            time: when,
            room: roomId
        };
    redis.zadd('messages:' + roomId, when, JSON.stringify(messageObj), function () {
        cb(null, messageObj);
    });
};

exports.getMessages = function (roomId, limit, cb) {
    var count, callback;
    if (arguments.length === 2) {
        count = 20;
        callback = limit;
    } else {
        count = Math.abs(limit);
        callback = cb;
    }
    redis.zrange('messages:' + roomId, (count * -1), -1, function (err, arrayOfJson) {
        var result = [];
        (arrayOfJson || []).forEach(function (message) {
            result.push(JSON.parse(message));
        });
        callback(err, result);
    });
};