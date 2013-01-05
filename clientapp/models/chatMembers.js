var BaseCollection = require('models/baseCollection'),
    ChatMember = require('models/chatMember');


module.exports = BaseCollection.extend({
    model: ChatMember,
    initialize: function () {
        this.on('add', this.getOnlineStatusFromContactList, this);
    },
    addMissing: function (participantArray) {
        var self = this;
        (participantArray || []).forEach(function (participantId) {
            if (self.get(participantId)) {
                self.add({id: participantId});
            }
        });
    },
    getOnlineStatusFromContactList: function () {
        this.each(function (chatMember) {
            var contact = chatMember.getRelatedContact();
            chatMember.set('online', contact ? contact.get('online') : 'offline');
        });
    }
});