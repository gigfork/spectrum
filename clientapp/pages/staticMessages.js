var PageView = require('pages/base'),
    ich = require('icanhaz');


module.exports = PageView.extend({
    render: function () {
        this.setElement(ich.staticMessagesPage(this.model.toTemplate()));
        return this;
    }
});