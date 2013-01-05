var BaseModel = require('models/baseModel'),
    _ = require('underscore'),
    phoney = require('phoney');


module.exports = BaseModel.extend({
    templateHelpers: ['name'],
    defaults: {
        online: 'offline'
    },
    name: function () {
        var contact = this.getRelatedContact();
        if (contact) {
            return contact.fullName();
        } else {
            return phoney.stringify(this.id);
        }
    },
    getRelatedContact: function () {
        return app.contacts.findByPhone(this.id);
    }
});