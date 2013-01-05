/*global console */
var BaseView = require('views/base'),
    ich = require('icanhaz');


module.exports = BaseView.extend({
    events: {
        'click .answer': 'handleAnswerClick',
        'click .ignore': 'handleIgnoreClick'
    },
    initialize: function (call) {
        this.call = call;
    },
    render: function () {
        this.setElement(ich.incomingCall(this.call));
        return this;
    },
    handleAnswerClick: function (e) {
        e.preventDefault();
        this.call.answer();
        console.log('answering', this.call);
        this.parent.hide();
    },
    handleIgnoreClick: function (e) {
        e.preventDefault();
        this.call.hangup();
        console.log('hanging up', this.call);
        this.parent.hide();
    }
});