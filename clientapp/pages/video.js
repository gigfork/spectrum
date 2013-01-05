var PageView = require('pages/base'),
    ich = require('icanhaz');


module.exports = PageView.extend({
    initialize: function () {
        this.on('show', this.onShow, this);
        this.on('hide', this.onHide, this);
    },
    render: function () {
        this.setElement(ich.videoPage(this.model.toTemplate()));
        return this;
    },
    onShow: function () {
        if (!app.activeCall && !app.incomingCall) {
            app.set('videoVisible', false); 
            app.navigate('messages');
        } else {
            app.set('videoVisible', true);
        }
    },
    onHide: function () {
        app.set('videoVisible', false);
    }
});