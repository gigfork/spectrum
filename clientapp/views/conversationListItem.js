var BaseView = require('views/base'),
    ich = require('icanhaz'),
    _ = require('underscore');


module.exports = BaseView.extend({
    events: {
        'click': 'onClick',
        'click .close': 'onCloseClick'
    },
    contentBindings: {
        'topic': 'h2'
    },
    initialize: function (stuff) {
        this.containerEl = $(stuff.containerEl);
        this.render();
    },
    render: function () {
        var newEl = ich.conversationListItem(this.model.toTemplate());
        $(this.el).replaceWith(newEl);
        this.setElement(newEl);
        this.containerEl.append(this.el);
        this.handleBindings();
        return this;
    },
    onCloseClick: function () {
        this.model.leave();
        app.conversations.remove(this.model);
    },
    onClick: function () {
        app.showConversation(this.model);
    }
});