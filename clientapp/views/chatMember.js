var BaseView = require('views/base'),
    ich = require('icanhaz'),
    _ = require('underscore');


module.exports = BaseView.extend({
    classBindings: {
        'online': ''
    },
    initialize: function (stuff) {
        this.containerEl = $(stuff.containerEl);
        this.render();
    },
    render: function () {
        var newEl = ich.chatMember(this.model.toTemplate());
        $(this.el).replaceWith(newEl);
        this.setElement(newEl);
        this.containerEl.append(this.el);
        this.handleBindings();
        this.$('.name').text(this.model.name());
        return this;
    }
});