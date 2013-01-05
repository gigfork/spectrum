var BaseCollection = require('models/baseCollection'),
    Contact = require('models/contact'),
    phoney = require('phoney'),
    metrics = require('metrics');


module.exports = BaseCollection.extend({
    url: '/apiproxy/a1/addressbook/contacts',
    model: Contact,
    initialize: function (models, app) {
        this.app = app;
    },
    parse: function (res) {
        metrics.track('loaded contacts', {quantity: res.entry && res.entry.length || 0});
        return res.entry;
    },
    showJidOnline: function (jid, sipAddress) {
        var user = this.getByJid(jid);
        if (user) {
            user.set({online: 'online'});
        }
    },
    showJidOffline: function (jid) {
        var user = this.getByJid(jid);
        if (user) {
            user.set({online: 'offline'});
        }
    },
    getByJid: function (jid) {
        return this.find(function (model) {
            var ims = model.attributes.ims;
            return ims && ims.length && ims[0].type === 'aim' && ims[0].value.split('/')[0] === jid;
        });
    },
    findByJid: function (jid) {
        var withoutResource = jid.split('/')[0];
        return this.find(function (model) {
            return model.get('sipAddress') === withoutResource;
        });
    },
    findByPhone: function (phone) {
        // strip all non-numbers and leading "1" if long
        var cleaned = phoney.getCallable(phone);
        return this.find(function (model) {
            var home = model.getPhone('home'),
                work = model.getPhone('work');
            home = home && phoney.getCallable(home.value);
            work = work && phoney.getCallable(work.value);
            return work == cleaned || home == cleaned; 
        });
    },
    getOnline: function () {
        return this.filter(function (model) {
            return model.get('online');
        });
    },
    findContact: function (value) {
        var contact = this.findByJid(value);
        if (contact) return contact;
        return this.findByPhone(value);
    }
});