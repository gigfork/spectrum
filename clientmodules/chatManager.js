/*
This module's only job is managing our socket.io we use for chat.

It consumes the chat library and translates it to backbone model changes.

*/
var ChatSession = require('chatSession'),
    _ = require('underscore'),
    Message = require('models/message');


module.exports = {
    init: function () {
        this.session = new ChatSession({token: app.get('accessToken')});
        this.session.on('ready', _.bind(this.handleInitialData, this));
        this.session.on('online', _.bind(this.handleOnline, this));
        this.session.on('offline', _.bind(this.handleOffline, this));
        this.session.on('joinedRoom', _.bind(this.handleJoined, this));
        this.session.on('leftRoom', _.bind(this.handleLeftRoom, this));
        this.session.on('message', _.bind(this.handleMessage, this));
        this.session.on('directChat', _.bind(this.handleDirectChat, this));
        this.session.on('newTopic', _.bind(this.handleNewTopic, this));

        this.loadSound('/audio/piano1.wav', 'chatReceive', 5000);
        this.loadSound('/audio/piano2.wav', 'chatSend', 5000);

        return this.session;
    },
    handleInitialData: function (data) {
        data.rooms.forEach(function (room) {
            console.log('room', room);
            app.conversations.add(room);
        });
    },
    loadSound: function (url, name, delay) {
        var effect = new Audio();
        setTimeout(function () {
            effect.src = url;
            effect.load();
        }, delay || 0);
        
        // store it
        this.soundEffects || (this.soundEffects = {});
        this.soundEffects[name] = effect;
    },
    playSound: function (name) {
        this.soundEffects[name].play();
    },
    handleOnline: function (phone) {
        console.log('online', phone);
        var contact = app.contacts.findByPhone(phone);
        if (contact) {
            console.log('found', contact.fullName(), phone);
            contact.set('online', 'online');
        }
        app.conversations.setAllPresence(phone, 'online');
    },
    handleOffline: function (phone) {
        var contact = app.contacts.findByPhone(phone);
        if (contact) contact.set('online', 'offline');
        app.conversations.setAllPresence(phone, 'offline');
    },
    handleJoined: function (room) {
        var convo = app.conversations.get(room.id);
        console.log('room', room);
        if (convo) {
            room.participants.forEach(function (id) {
                console.log('looping', id);
                convo.addMember(id);
            });    
        } else {
            app.conversations.add(room);
        }
        
    },
    handleLeftRoom: function (event) {
        var convo = app.conversations.get(event.room);
        if (!convo) return;

        if (app.me.isMe(event.user)) {
            app.conversations.remove(convo);
            if (app.currentPage.model == convo) {
                app.navigate('messages');
            }  
        } else {
            convo.members.remove(event.user);
        }
    },
    handleMessage: function (event) {
        var convo = app.conversations.get(event.room),
            message;
        if (convo) {
            message = new Message(event);
            convo.messages.add(message);
            if (message.get('me')) {
                this.playSound('chatSend');
            } else {
                this.playSound('chatReceive');
            }
        }
    },
    handleDirectChat: function (event) {
        var message = new Message(event), 
            otherUser;
        if (app.me.isMe(message.get('from'))) {
            otherUser = app.contacts.findByPhone(message.get('to'));
        } else if (app.me.isMe(message.get('to'))) {
            otherUser = app.contacts.findByPhone(message.get('from'));
        }
        if (otherUser) {
            otherUser.messages.add(message);
            if (message.get('me')) {
                this.playSound('chatSend');
            } else {
                this.playSound('chatReceive');
            }
        }
    },
    handleNewTopic: function (event) {
        var convo = app.conversations.get(event.id);
        if (convo) {
            convo.set('topic', event.topic);
        }
    }
};
