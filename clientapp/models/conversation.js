var BaseModel = require('models/baseModel'),
    Messages = require('models/messages'),
    Members = require('models/chatMembers'),
    _ = require('underscore');


module.exports = BaseModel.extend({
    templateHelpers: ['contacts'],
    initialize: function (stuff) {
        this.members = new Members();
        stuff.participants.forEach(_.bind(this.addMember, this));
        this.unset('participants');
        this.messages = new Messages();
        this.messages.add(stuff.messages);
    },
    addMember: function (id) {
        if (!this.members.get(id)) {
            this.members.add({id: id});
        }
    },
    removeMember: function (id) {
        this.members.remove(id);
    },
    contacts: function () {
        return this.members.map(function (member) {
            return member.toTemplate();
        });
    },
    sendMessage: function (messageBody) {
        app.chatSession.sendMessage(this.id, messageBody);
    },
    leave: function () {
        app.chatSession.leave(this.id);
    },
    invite: function () {
        app.chatSession.invite(this.id);
    },
    show: function () {
        app.navigate('messages/' + this.id);
    },
    setTopic: function (newTopic) {
        app.chatSession.setRoomTopic(this.id, newTopic);
    }
});