/*global MD5 ui*/
var BaseModel = require('models/baseModel'),
    _ = require('underscore'),
    phoney = require('phoney'),
    callManager = require('callManager'),
    Messages = require("models/messages");


module.exports = BaseModel.extend({
    templateHelpers: ['fullName', 'getCallableNumber', 'getContactName'],
    defaults: {
        online: 'offline'
    },
    viewChat: function () {
        app.navigate('contacts/' + this.id);
    },
    viewModel: function () {
        app.navigate('contacts/' + this.id + '/profile'); 
    },
    editModel: function () {
        app.navigate('contacts/' + this.id + '/edit');
    },
    initialize: function () {
        this.messages = new Messages();
    },
    fetchMessageHistory: function () {
        // TODO
    },
    toForm: function () {
        var d = this.toJSON();
        return {
            firstName: d.name && d.name.givenName,
            lastName: d.name && d.name.familyName,
            middleName: d.name && d.name.middleName,
            company: d.organizations[0] && d.organizations[0].name,
            title: d.organizations[0] && d.organizations[0].title,
            street: d.addresses[0] && d.addresses[0].street,
            email: this.getEmail('home') && this.getEmail('home').value,
            homePhone: function () {
                var phoneNumber = _(d.phoneNumbers || []).find(function (phone) {
                        return phone.type === 'home' && phone.value;
                    });
                return phoneNumber && phoneNumber.value || '';
            }(),
            workPhone: function () {
                var phoneNumber = _(d.phoneNumbers || []).find(function (phone) {
                        return phone.type === 'work' && phone.value;
                    });
                return phoneNumber && phoneNumber.value || '';
            }(),
            picUrl: function () {
                var email = d.emails && d.emails[0] && d.emails[0].value;
                if (email) {
                    return 'https://secure.gravatar.com/avatar/' + MD5.hexdigest(email) + '.png?s=100&d=' + encodeURIComponent('https://cardbox.alpha-api.com/img/fallback.png');
                } else {
                    return '/img/fallback.png';
                }
            }(),
            videoJid: function () {
                var jid;
                try {
                    jid = d.ims[0].value;
                } catch (e) {}

                return jid || '';
            }()
        };
    },
    getPhone: function (type) {
        return _.find(this.get('phoneNumbers') || [], function (number) {
            return number.type === type;
        });
    },
    getEmail: function (type) {
        return _.find(this.get('emails') || [], function (email) {
            return email.type === type;
        });
    },
    smartDelete: function () {
        var self = this;
        this.destroy({
            wait: false,
            error: function () {
                app.set('loadingDialog', "Error deleting contact, fetching current contacts");
                app.contacts.fetch({
                    success: function () {
                        self.viewModel();
                    }
                });
            }
        });
        app.showFirstContact();
    },
    confirmDelete: function () {
        var self = this;
        ui.confirm('Remove: ' + self.fullName(), 'are you sure?')
            .modal()
            .ok('Remove')
            .cancel('Cancel')
            .show(function (ok) {
                if (ok) self.smartDelete();
            });
    },
    fullName: function () {
        var all = this.toForm();
        return all.firstName + ' ' + all.lastName;
    },
    xmppJid: function () {
        if (this.get('sipAddress')) {
            return 'xmpp:' + this.get('sipAddress');
        }
    },
    call: function (video) {
        // ignore if offline
        //if (this.get('online') !== 'online') return;
        callManager.startPhoneCall(this);
    },
    message: function (message) {
        app.message(this, message);
    },
    sms: function (message) {
        var number = this.getCallableNumber();
        if (number) {
            $.post('/proxy/a1/messages/messages', {
                text: message,
                recipient: number
            });
        }
    },
    startConversation: function () {
        var convo = app.conversations.findForUser(this.getCallableNumber());
        if (convo) {
            app.showConversation(convo.id);
        } else {
            app.chatSession.createRoom(this.getCallableNumber());
        }
    },
    // attempts to get a contact name at all costs
    getContactName: function () {
        var name = this.get('name');
        if (this.get('name').givenName) {
            return this.get('name').givenName + " " + this.get('name').familyName;
        } else if (this.getPhone('home')) {
            return this.getPhone('home').value;
        } else if (this.getPhone('work')) {
            return this.getPhone('work').value;
        } else if (this.get('emails')) {
            return this.get('emails')[0].value;
        } else {
            return "Unnamed";
        }
    },
    // get a phone number
    getCallableNumber: function () {
        var home = this.getPhone('home'),
            work = this.getPhone('work');
        if (work) return phoney.getCallable(work.value);
        if (home) return phoney.getCallable(home.value);
        return;
    }
});
