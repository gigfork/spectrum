var BaseCollection = require('models/baseCollection'),
    Conversation = require('models/conversation');


module.exports = BaseCollection.extend({
    model: Conversation,
    initialize: function () {
        //
    },
    parse: function (response) {
        return response.messages;
    },
    show: function () {
        app.showConversation(this);
    },
    findForUser: function (userId) {
        return this.find(function (convo) {
            return convo.members.length == 2 && convo.members.get(userId);
        });
    },
    setAllPresence: function (phone, presence) {
        this.each(function (convo) {
            var member = convo.members.get(phone);
            if (member) member.set('online', presence);
        });
    }
});