var BaseCollection = require('models/baseCollection'),
    Message = require('models/message');


module.exports = BaseCollection.extend({
    url: '/apiproxy/a1/messages/messages',
    model: Message,
    parse: function (response) {
        return response.messages;
    }
});