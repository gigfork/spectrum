/*global console app ui Strophe Phono MD5*/
var Backbone = require('backbone'),
    _ = require('underscore'),
    BaseModel = require('models/baseModel'),
    MainView = require('views/main'),
    Contacts = require('models/contacts'),
    Groups = require('models/groups'),
    Files = require('models/files'),
    Me = require('models/me'),
    Messages = require('models/messages'),
    Conversation = require('models/conversation'),
    Conversations = require('models/conversations'),
    IncomingCallView = require('views/incomingCall'),
    Apps = require('models/apps'),
    MainRouter = require('routers/main'),
    async = require('async'),
    ich = require('icanhaz'),
    cookies = require('cookies'),
    callManager = require('callManager'),
    chatManager = require('chatManager'),
    metrics = require('metrics');
    

// This is our main Application controller
// we use a Backbone model here just so we can
// set application state flags directly on the
// application and use that to trigger events
module.exports = BaseModel.extend({
    defaults: {
        'activeContact': '',
        'number': '',
        'accessToken': '',
        'currentCaller': 'unknown',
        'videoVisible': false,
        'profileMenuVisible': false
    },
    initialize: function () {
        var self = this;

        this.me = new Me();
        this.contacts = new Contacts([], this);
        this.groups = new Groups();
        this.files = new Files();
        this.messages = new Messages();
        this.conversations = new Conversations();
        this.apps = new Apps();
        
        // set our sms auth flag if we find that
        // flag in the url
        if (location.href.indexOf('sms') !== -1) {
            this.set('smsauth', true);
        } 

        // init our main application view
        // this will render itself when the DOM is 
        // ready
        this.view = new MainView({model: this});

        // bind some events to our connection
        this.on('change:accessToken', this.handleAccessTokenChange, this);
    },
    blastOff: function () {
        console.log('blastoff called');
        var self = this;
        async.series([
            function (cb) {
                // set our access token from the cookie if it's there or try to grab
                // it from localstorage
                app.set('accessToken', cookies('t') || localStorage.accessToken);
                ich.grabTemplates(cb);
            },
            function (cb) {
                if (app.get('accessToken')) {
                    self.getData(cb);    
                } else {
                    cb();
                }
            },
            function (cb) {
                self.view.on('rendered', function () {
                    console.log('rendering');
                    cb();
                });
                self.view.render();
            },
            function (cb) {
                self.chatSession = chatManager.init();
                self.chatSession.on('ready', cb);
            }
        ], function () {
            new MainRouter();    

            // our main history tracking
            self.history = Backbone.history;
            self.history.start({pushState: true});
        });
    },
    getData: function (cb) {
        var self = this;
        this.groups.fetch();
        this.files.fetch();
        this.messages.fetch();
        async.parallel([
            function (cb) {
                self.fetchContacts(cb);
            },
            function (cb) {
                self.fetchMe(cb);
            }
        ], cb);
    },
    fetchContacts: function (cb) {
        cb || (cb = function () {});
        this.contacts.fetch({
            success: function () {
                cb();
            },
            error: function () {
                cb(new Error('Failed to get contacts'));
            }
        });
    },
    fetchMe: function (cb) {
        var self = this;
        cb || (cb = function () {});
        this.me.fetch({
            success: function () {
                console.log('got ME');
                self.set('gravatar', self.me.gravatar());
                metrics.identify(self.me.get('phone_number'));

                // set up our call manager when it's done
                callManager.init(app.me.get('uid'), app.get('accessToken'));
                cb();
            },
            error: function () {
                cb(new Error('Failed to retrieve user info'));
            }
        });
    },
    wipeData: function () {
        this.contacts.reset();
        this.groups.reset();
        this.files.reset();
        this.messages.reset();
        delete localStorage.accessToken;
        this.set('accessToken', '');
        this.set('gravatar', '');
        this.me.clear();
        callManager.disconnect();
        setTimeout(function () {
            window.location = '/';
        }, 1500);
    },
    makeVideoCall: function (callee) {
        metrics.track('started video call');
        this.videoCall = this.phono.phone.dial(callee, {
            tones: true,
            onAnswer: function (event) {
                metrics.track('video call answered');
                console.log('on answer');
            },
            onHangup: function () {
                metrics.track('stopped video call');
                console.log('onhangup');

            }
        }); // end dial
    },
    handleAjaxError: function (e, res) {
        console.log('got an error!!!', e, res);
        // if unauthorized or get nothing, assume logged out.
        if (!app.get('autoAnswerFBInvite')) {
            if (res.status === 401 || res.status === 0) {
                console.log('got a 401');
                app.set('authStatus', 'loggedOut');
                ui.dialog('Please log in', ich.loginDialog()).modal().show();
            }

            // if we get a 417 from the gateway it means we don't have a linked phonenumber for this user
            if (res.status === 417) {
                ui
                    .dialog("Please link your phone number", $("<p>Please make sure to link a phone number to your <a href='http://auth.tfoundry.com'>user account</a></p>"))
                    .overlay()
                    .show();
                metrics.track('phone not linked error');
            }
        } 
    },
    
    // here we store the access token in localstorage each time it changes
    handleAccessTokenChange: function () {
        localStorage.accessToken = app.get('accessToken') || '';
    },

    // XMPP event handlers
    handleSipAddress: function (e, payload) {
        app.contacts.showJidOnline(payload.who, payload.sipAddress);
    },
    handleUnavailable: function (e, payload) {
        console.log('unavailable', payload);
        app.contacts.showJidOffline(payload.who);
    },

    handlePresence: function (e, payload) {
		//alert("going to handle presence");
        console.log("got presence event from: " + payload.fromJid + " status: " + payload.online);
        //var contact = {name: {givenName: 'first', familyName: 'last'}, organizations: [], addresses: []};
        //_.extend(contact, payload);
        //app.contacts.add(contact);
        app.contacts[payload.online ? 'showJidOnline' : 'showJidOffline'](payload.fromJid, payload.sipAddress);     
    },    
    handleMessageReceived: function (e, message) {
        console.log('FROM', message.from);
        var contact = app.contacts.findByJid(message.from),
            convo;
        if (contact) {
            metrics.track('chat received');
            convo = app.conversations.getOrNew(contact.id);    
            app.showConversation(convo);
            convo.messages.add(message);
        }
    },

    message: function (contact, messageBody) {
        var convo = app.conversations.getOrNew(contact.id);
        callManager.sendMessage(contact.get('sipAddress'), messageBody);
        app.showConversation(contact);
        convo.messages.add({to: contact.id, body: messageBody, me: true});
    },

    // This is how you navigate around the app. 
    // this gets called by a global click handler that handles
    // all the <a> tags in the app.
    // it expects a url without a leading slash.
    // for example: "costello/settings".
    navigate: function (page) {
        console.log('navigating to: ' + page);
        this.history.navigate(page, true);
        metrics.pageView(page);
        app.set('profileMenuVisible', false);
    },

    showFirstContact: function () {
        if (this.contacts && this.contacts.length) {
            this.contacts.first().viewModel();
        }
    },

    showContact: function (id) {
        var contact = this.contacts.get(id);
        if (contact) contact.viewModel();
    },

    showConversation: function (roomId) {
        var convo = app.conversations.get(roomId);
        if (convo) app.navigate('messages/' + convo.id);
    },

    renderPage: function (view) {
        console.log('RENDER PAGE CALLED');
        var self = this,
            container = app.view.$('#pages'),
            path = window.location.pathname,
            found = false;
        
        if (app.currentPage) {
            app.currentPage.hide();
        }

        // we call render, but if animation is none, we want to tell the view
        // to start with the active class already before appending to DOM.
        container.append(view.render().el);
        view.show();
    },

    createFacebookUrl: function (facebookUser) {
        var appid = '331655900211365';
        var url = "http://www.facebook.com/dialog/send?app_id=" + appid + "&" +
            "to=" + facebookUser + "&" +
            "name=Please join me in a video chat&" +
            "description=Please join me in a video chat&" +
            "link=" + encodeURIComponent(this.getShareUrl()) + "&" +
            "redirect_uri=http://pupil.iris.pao1.tfoundry.com/test/close.html";
        return url;
        //window.location = url;
    },

    getShareUrl: function () {
        var res = {
                sipAddress: this.get('sipAddress'),
                name: this.me.get('name'),
                picUrl: this.me.get('profile_image')
            },
            stringified = JSON.stringify(res);
        return location.origin + "/video-invite#" + encodeURIComponent(stringified);
    },

    getSecureGravatarUrlFromEmail: function (email) {
        return 'https://secure.gravatar.com/avatar/' + MD5.hexdigest(email) + '.png?s=100&d=' + encodeURIComponent('https://cardbox.alpha-api.com/img/fallback.png');
    },
    
    generateShortUrl: function () {
        $.ajax({
            url: "https://api-ssl.bitly.com/v3/shorten",
            data: {
                longUrl: app.getShareUrl(),
                login: "henrikjoreteg",
                apiKey: "R_4c6dbe0204eb0cd8be8256ce15043257"
            },
            dataType: 'json',
            success: function (res) {
                if (res.data && res.data.url) {
                    app.set('shortUrl', res.data.url);
                }
            }
        });
    },
    sendFacebookInvite: function () {
        this.set({
            autoAnswerFBInvite: true,
            autoAnswer: true
        });

        $.ajax({
            url: "http://iris.tfoundry.com/fbchaturl?url=" + app.get('shortUrl') + "&recipient=100003586849571",
            success: function (res) {
                metrics.track('facebook invite sent');
            }
        });
    }
});
