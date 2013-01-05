
/*global NoClickDelay Spinner ui*/
var BaseView = require('views/base'),
    _ = require('underscore'),
    ich = require('icanhaz'),
    IHazForm = require('ihazform'),
    FilesPage = require('pages/files'),
    Contact = require('models/contact'),
    Dialpad = require('dialpad'),
    SidebarView = require('views/sidebar'),
    TimerView = require('views/timer'),
    oauth = require('oauth'),
    LoginView = require('views/loginDialog'),
    callManager = require('callManager'),
    metrics = require('metrics');


module.exports = BaseView.extend({
    events: {
        'change #groupSelect': 'domGroupChange',    
        'click #addContact': 'domAddContactClick',
        'click .facebookInvite': 'domHandleFacebookClick',
        'click .toggleView': 'domToggleView',
        'click .showDialer': 'showDialer',
        'click .sendInvite': 'domSendInviteClick',
        // these selectors need updating to match new html
        'click .callActions button': 'handleCallActionClick',
        'click button.startNewGroupChat': 'handleStartNewGroupChat',
        'click #navButton': 'handleNavMenuButtonClick',
        'touchstart #navButton': 'handleNavMenuButtonClick', // needed for iOS
        'click a:not([data-ext])': 'handleLinkClick',
        'click #loginButton': 'domHandleLoginClick',
        'click': 'globalClickHandler'
    },
    classBindings: {
        'dialerVisible': '#screen',
        'callStatus': '#callStatus',
        'profileMenuVisible active': '#navActions'
    },
    contentBindings: {
        'sipAddress': '#sipAd',
        'currentCaller': '.callerName'
    },
    imageBindings: {
        'currentCallerPic': '.callerAvatar',
        'gravatar': '.gravatar'
    },
    render: function () {
        this.setElement(document.body);
        this.$el.html(ich.app(this.model.toJSON()));
        this.bindomatic(this.model, 'change:drawerOpen', this.handleDrawerOpenChange);
        this.bindomatic(this.model, 'change:videoVisible', this.handleVideoVisibleChange, {trigger: true});
        this.bindomatic(this.model, 'change:callStatus', this.handleCallStatusChange, {trigger: true});
        this.bindomatic(this.model, 'change:accessToken', this.handleAccessTokenChange, {trigger: true});
        this.bindomatic(this.model, 'change:loadingDialog', this.handleLoadingDialogChange);
        this.bindomatic(this.model.contacts, 'fetch', this.handleContactsFetch, {trigger: true});
        this.bindomatic(this.model.contacts, 'reset', this.handleContactsReset);
        this.bindomatic(this.model, 'pageloaded', this.handlePageLoaded);
        
        // manually binding this to keep phonegap happy
        this.$('#logout').click(_.bind(this.handleLogoutClick).bind(this));
        this.$('#refresh').click(function () {
            window.location.reload();
        });
        

        // render subviews
        this.sidebar = new SidebarView({
            collection: this.model.contacts,
            el: this.$('aside')[0]
        }).render();

        this.clock = new TimerView({
            el: this.$('.callTime')[0]
        }).render();

        this.loginView = new LoginView({
            model: this.model
        });

        // get rid of our tap delays (hopefully)
        //NoClickDelay(this.el);

        this.handleBindings();

        this.trigger('rendered');

        metrics.track('app rendered');

        var self = this;

        return this;
    },

    handlePageLoaded: function () {
        this.$('#tabs a').each(function () {
            var el = $(this);
            if (el.attr('href') === '/' + location.pathname.split('/')[1]) {
                el.addClass('active');
            } else {
                el.removeClass('active');
            }
        });
    },
    handleCallStatusChange: function (model, val) {
        var status = this.model.get('callStatus');
        
        $('body')[status ? 'addClass' : 'removeClass']('call');

        if (status === 'waiting') {
            this.callSpinner = this.callSpinner || new Spinner({
                lines: 11,
                length: 9,
                width: 5,
                radius: 11,
                rotate: 0,
                color: '#fff',
                speed: 0.9,
                trail: 20,
                shadow: true,
                zIndex: 2e9
            });
            this.callSpinner.spin(this.$('#callStatus')[0]);
        } else {
            if (this.callSpinner) this.callSpinner.stop();
        }

        switch (status) {
        case 'incoming':
            
            break;
        case 'paused':
            
            break;
        case 'local':
            this.clock.start();
            break;
        default:
            if (this.clock) this.clock.stop();
            break;
        }
    },
    handleActiveGroupChanged: function () {
        this.model.contacts.fetch();
    },
    handleDrawerOpenChange: function (model, val) {
        var value = val;
        setTimeout(function () {
            $('body')[value ? 'addClass': 'removeClass']('drawerOpen');
        }, 0);
    },
    handleAuthStatusChange: function (model, val) {
        if (val === 'unknown') {
            ui.dialog("connecting...").overlay().show();
        } else if (val === 'authed') {
            ui.dialog('logged in').overlay().show().hide(1000);
        } else {
            ui.dialog('Please log in', ich.loginDialog()).overlay().show();
        }
    },
    handleAccessTokenChange: function (model, val) {
        var hasToken = !!app.get('accessToken'),
            doors = $('.loginDoors');
        
        if (hasToken) {
            doors.addClass('open');
            _.delay(function () {
                doors.hide(0);
            }, 2000);
        } else {
            doors.show(0);
            doors.removeClass('open');
        }
    },
    domHandleFacebookClick: function () {
        app.sendFacebookInvite();
        _.delay(function () {
            ui.dialog('').show().hide();
        }, 500);
        return false;
    },
    domHandleLoginClick: function (e) {
        oauth.login(); 
        return false;
    },
    domGroupChange: function (e) {
        var val = $(e.target).val();
        this.model.set('activeGroup', val);
    },
    domToggleView: function () {
        this.model.set('drawerOpen', !this.model.get('drawerOpen'));
    },
    domAddContactClick: function () {
        app.set('drawerOpen', false);
        app.navigate('contacts/new');
    },
    domSendInviteClick: function (e) {
        metrics.track('share button pressed');
        e.preventDefault();
        e.stopImmediatePropagation();
        ui.dialog('Start Video Call', ich.shareDialog({url: app.get('shortUrl') || app.getShareUrl()})).overlay().closable().show();
    },

    showDialer: function () {
        var dialpad = new Dialpad(),
            dialog = ui.dialog(dialpad.render()).overlay().closable().show();

        dialpad.on('call', function (number) {
            callManager.startPhoneCall(number);
        });
        dialog.on('close', _.bind(dialpad.hide, dialpad));
    },

    handleCallActionClick: function (e) {
        var action = $(e.target).data('action'),
            convo;

        // give an immediate visual response
        app.set('callStatus', 'waiting');

        switch (action) {
        case 'take':
            metrics.track('take remote call');
            callManager.takeRemoteCall();
            break;
        case 'ignore':
            metrics.track('call ignored');
            callManager.rejectIncomingCall();
            break;
        case 'hangUp':
            metrics.track('hang up button pushed');
            callManager.endActiveCall();
            break;
        case 'push':
            metrics.track('push call button pushed');
            callManager.pushActiveCallToMobile();
            break;
        case 'answer':
            metrics.track('answer button pushed');
            callManager.answerIncomingCall();
            break;
        case 'mute':
            metrics.track('mute button pushed');
            callManager.mute();
            break;
        }

        e.preventDefault();
        return false;
    },

    handleLinkClick: function (e) {
        var target = $(e.target).attr('href');
        if (target && target.charAt(0) !== 'h' && !target.match('proxy') && !target.match('logout')) {
            app.navigate(target);
            e.preventDefault();
            return false;
        }
        if (target.match('logout')) {
            app.wipeData();
            return false;
        }
    },

    handleContactsFetch: function () {
        this.contactsSpinner = this.contactsSpinner || new Spinner();
        this.contactsSpinner.spin(this.$('aside')[0]);
    },

    handleContactsReset: function () {
        this.contactsSpinner.stop();
    },

    handleVideoVisibleChange: function () {
        this.$('#videos')[this.model.get('videoVisible') ? 'show' : 'hide']();
    },

    handleLoadingDialogChange: function () {
        var loadingDialogMessage = this.model.get('loadingDialog'),
            el,
            spinner;
        
        if (loadingDialogMessage) {
            el = ich.spinnerDialog({message: loadingDialogMessage}),
            this.loadingDialog = ui.dialog(el).modal().show();
            new Spinner().spin($('> div', el)[0]);
        } else {
            this.loadingDialog && this.loadingDialog.hide();
        }
    },

    handleLogoutClick: function (e) {
        app.wipeData();
        return false;
    },

    handleNavMenuButtonClick: function (e) {
        this.model.toggle('profileMenuVisible');
        e.preventDefault();
        return false;
    },

    handleStartNewGroupChat: function () {
        var defaultTopic = 'Group chat ' + (app.conversations.length + 1);
        app.chatSession.createGroupChat(defaultTopic, function (room) {
            var roomModel = app.conversations.get(room.id);
            if (roomModel) roomModel.show();
            _.defer(function () {
                $('.topic').focus();
            }, 500);
        });
    },

    globalClickHandler: function () {
        app.set('profileMenuVisible', false);
    }
});
