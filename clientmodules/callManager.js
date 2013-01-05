/*global*/
var att = require('att'),
    _ = require('underscore'),
    metrics = require('metrics'),
    phoney = require('phoney'),
    getQueryParam = require('getQueryParam');


module.exports = {
    init: function (userId, token) {
        var self = this;
        // expose it to the window for convenience
        this.att = new att.Phone({
            apiKey: token,
            onIncomingCall: this.onInvite.bind(this)
        });

        // init some sounds
        this.ringtoneSound = new Audio();
        this.ringtoneSound.src = '/audio/ringtone.wav';
        this.ringtoneSound.loop = true;
        this.ringtoneSound.load();
        this.callingSound = new Audio();
        this.callingSound.src = '/audio/calling.wav';
        this.callingSound.loop = true;
        this.callingSound.load();

        return;
    },

    // commands
    sendMessage: function (to, message) {
        //this.phono.messaging.send(to, message);
    },

    onInvite: function (call) {
        console.log('getting incoming call', call);
        this.registerHandlersForCall(call);
        this.handleIncomingCall(call);
    },

    endActiveCall: function () {
        app.activeCall.hangup();
        this._reset();
        // if we're on the video page, go back
        if (window.location.pathname === '/video') {
            window.history && window.history.back();    
        }
    },

    answerIncomingCall: function () {
        console.log('answer incoming called');
        var call = app.incomingCall;
        app.incomingCall = null;
        app.activeCall = call;
        app.activeCall.answer();
    },

    pushActiveCallToMobile: function () {
        app.set('callStatus', 'waiting');
    },

    rejectIncomingCall: function () {
        app.incomingCall.hangup();
        this._reset();
    },

    _clearCalls: function () {
        delete app.activeCall;
        delete app.incomingCall;
    },

    registerHandlersForCall: function (call) {
        console.log('in REGSITER HANDLERS FOR CALL');
        call.on('callBegin', _.bind(this.handleCallConnected, this));
        call.on('callEnd', _.bind(this.handleCallEnded, this));
    },
    
    handleStreamAdded: function (e) {
        console.log('STREAM ADDED', e);
    },

    handleHangup: function () {
        /*
        // if we're getting an incoming video call then we
        // assume this is an "upgrade" of the existing call
        // to video
        if (app.activeCall && app.incomingCall.initiator.length > 13) return;
        */
        if (app.activeCall) {
            this.handleCallEnded();
        } else {
            this.handleInActiveHangup();
        }

        // if we're on the video page, go back
        if (window.location.pathname === '/video') {
            window.history && window.history.back();    
        }
    },

    // handler for a call where we are currently talking on the local device
    handleCallEnded: function () {
        app.set('callStatus', 'ending');
        if (window.location.pathname === '/video') {
            window.history && window.history.back();    
        }
        // after a bit, close it entirely
        _.delay(_.bind(this._reset, this), 500);

        metrics.track('call ended');

        this._clearState();
        this._stopAudio();
    },

    // handles hangup of remote caller if we never answered it locally
    handleInActiveHangup: function () {
        this.activeCall = null;
        this._clearState();
    },

    _reset: function () {
        this._clearState();
        this._clearCalls();
        this._stopAudio();
    },

    _stopAudio: function () {
        this.ringtoneSound.pause();
        this.ringtoneSound.currentTime = 0;
        this.callingSound.pause();
        this.callingSound.currentTime = 0;
    },

    _clearState: function () {
        app.set({
            currentRemote: '',
            callStatus: '',
            currentCaller: '',
            currentCallerPic: '/img/fallback.png'
        });
    },

    handleCallConnected: function (event) {
        console.log('HANDLE CALL ANSWERED', event);
        app.set({
            callStatus: 'local'
        });
        this._stopAudio();
    },

    handleIncomingCall: function (call) {
        console.log('GOT INCOMING CALL', call);
        var call = app.incomingCall = call,
            callNumber = call.recipient.split('@')[0].split('sip:')[1],
            caller = app.contacts.findContact(callNumber),
            self = this;

        app.set('callStatus', 'incoming');

        // play our audio
        this.ringtoneSound.play();
       
        if (caller) {
            app.set({
                currentCaller: caller.fullName(),
                currentCallerPic: caller.toForm().picUrl
            });
        } else {
            app.set({
                currentCaller: 'Incoming call from: ' + phoney.stringify(callNumber),
                currentCallerPic: '/img/fallback.png'
            });
        }
    },

    // initiate phone call
    //So far only two things call this, the dialer and the contact.
    //Need to be able to call with and without video (jid determines this)
    startPhoneCall: function (number) {
        var self = this,
            isVideoCall = false,
            phoneNumber, 
            contact;
        
        this.callingSound.play();

        app.set({
            callStatus: 'calling',
            dialerVisible: false
        });
        if (typeof number === 'object') { //Contact object
            contact = number;
            app.set({
                currentCaller: contact.fullName(),
                currentCallerPic: contact.toForm().picUrl
            });
            phoneNumber = contact.getCallableNumber();
        } else { //Dial pad
            phoneNumber = number;
            //Attempt to look up current caller
            contact = app.contacts.findContact(number);
            if (contact) {
                app.set({
                    currentCaller: contact.fullName(),
                    currentCallerPic: contact.toForm().picUrl
                });
            } else {
                app.set({
                    currentCaller: phoney.stringify(number),
                    currentCallerPic: '/img/fallback.png'
                });
            }
        }

        //Phone number technically could still be blank here
        app.activeCall = this.att.dial(phoneNumber);
        this.registerHandlersForCall(app.activeCall);
        app.set('callStatus', 'calling');
    },
};
