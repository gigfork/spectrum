var BaseView = require('views/base'),
    ich = require('icanhaz');


module.exports = BaseView.extend({
    render: function () {
        this.setElement(ich.fileTypeItem(this.model.toTemplate()));
        return this;
    }
});