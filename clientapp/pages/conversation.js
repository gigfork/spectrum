var PageView = require('pages/base'),
    ich = require('icanhaz'),
    ChatMemberView = require('views/chatMember'),
    AddUserDialog = require('views/addUserDialog'),
    _ = require('underscore');


module.exports = PageView.extend({
    events: {
        'keydown .chatInput': 'handleKeyUp',
        'click .chatSend': 'handleChatSendClick',
        'click .addUsers': 'handleAddUsersClick',
        'blur .topic': 'handleTopicBlur'
    },
    inputBindings: {
        'topic': '.topic'
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
        var context = {},
            self = this;
        if (this.model) {
            context = this.model.toTemplate();
            _.extend(context, {
                messages: this.model.messages.map(function (message) {
                    return message.toTemplate();
                })
            });
        }
        this.setElement(ich.conversation(context));
        this.$input = this.$('.chatInput');
        this.$discussion = this.$('.discussion');
        this.$dropOverlay = this.$('.dragOverlay');

        if (this.model) {
            // trigger this each time
            this.handleChangeOnline();
        }

        // make drop target so we can drag people into the chat
        this.$dropOverlay.droppable({
            drop: function (event, ui) {
                self.addUserToConversation(ui.helper[0].contact);
            },
            hoverClass: 'over',
            activeClass: 'active',
            activate: function () {
                $(this).addClass('active');
            }
        });

        // draw and maintain our chat member objects
        this.collectomatic(this.model.members, ChatMemberView, {containerEl: this.$('.members')});

        this.handleBindings();

        this.model.members.getOnlineStatusFromContactList();

        return this;
    },
    addUserToConversation: function (contact) {
        var phone = contact.getCallableNumber();
        if (phone) {
            app.chatSession.addUserToRoom(this.model.id, phone);
        }
    },
    handleMessageAdd: function (model, collection) {
        var height;
        this.$discussion.append(ich.chatMessage(model.toTemplate()));
        height = this.$discussion.height();
        if (height > ($(window).height() - 130)) {
            $('body').animate({scrollTop: height + 130});
        }
    },
    sendCurrent: function () {
        var val = this.$input.val();
        if (val) {
            app.chatSession.sendMessage(this.model.id, val);
            this.$input.val('');
            /*
            if (contact.get('online')) {
                            
            } else {
                this.sendCurrentAsSMS();
            }
            */
        }
    },
    handleKeyUp: function (e) {
        if (e.which === 13) {
            this.sendCurrent();
            return false;
        }
    },
    handleChatSendClick: function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        this.sendCurrent();
    },
    handleChangeOnline: function () {
        if (this.contact) {
            this.$('.chatField')[this.contact.get('online') ? 'addClass' : 'removeClass']('online');
        }
    },
    handleAddUsersClick: function () {
        // TODO
        new AddUserDialog();
    },
    handleTopicBlur: function () {
        this.model.setTopic(this.$('.topic').val());
    }
});