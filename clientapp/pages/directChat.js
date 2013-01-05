var PageView = require('pages/base'),
    ich = require('icanhaz'),
    _ = require('underscore');


module.exports = PageView.extend({
    events: {
        'keydown .chatInput': 'handleKeyUp',
        'click .chatSend': 'handleChatSendClick',
        'click .viewProfile': 'handleViewProfileClick',
        'click .smsSend': 'handleSMSSendClick'
    },
    initialize: function (stuff) {
        if (stuff.model) {
            this.bindomatic(this.model.messages, 'add', this.handleMessageAdd);
            var contact = this.contact = this.model.getRelatedContact && this.model.getRelatedContact();
            if (contact) {
                this.bindomatic(contact, 'change:online', this.handleChangeOnline);
            }
        }
    },
    render: function () {
        var context = {
            messages: this.model.messages.map(function (message) {
                return message.toTemplate();
            }),
            contact: this.model.toTemplate()
        };
        this.setElement(ich.directConversationPage(context));
        this.$input = this.$('.chatInput');
        this.$discussion = this.$('.discussion');
        this.$dropOverlay = this.$('.dragOverlay');
        this.handleChangeOnline();

        return this;
    },
    handleViewProfileClick: function () {
        this.model.viewModel();
    },
    handleMessageAdd: function (model, collection) {
        var height;
        this.$discussion.append(ich.chatMessage(model.toTemplate()));
        height = this.$discussion.height();
        if (height > ($(window).height() - 130)) {
            $('body').animate({scrollTop: height + 130});
        }
    },
    handleKeyUp: function (e) {
        if (e.which === 13) {
            this.sendCurrent();
            return false;
        }
    },
    sendCurrent: function () {
        var val = this.$input.val();
        if (val) {
            app.chatSession.sendDirectChat(this.model.getCallableNumber(), val);
            this.$input.val('');
            /*
            if (contact.get('online')) {
                            
            } else {
                this.sendCurrentAsSMS();
            }
            */
        }
    },
    sendCurrentAsSMS: function () {
        var val = this.$input.val(),
            contact = this.model.getRelatedContact();
        if (val && contact) {
            contact.sms(this.$input.val());
            this.$input.val('');
            this.model.messages.add({to: contact.id, body: val, me: true, type: 'sms'});
        }
    },
    handleChatSendClick: function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        this.sendCurrent();
    },
    handleSMSSendClick: function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        this.sendCurrentAsSMS();
    },
    handleChangeOnline: function () {
        if (this.contact) {
            this.$('.chatField')[this.contact.get('online') ? 'addClass' : 'removeClass']('online');
        }
    }
});