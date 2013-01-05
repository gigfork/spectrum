var BaseCollection = require('models/baseCollection'),
    Group = require('models/group');


module.exports = BaseCollection.extend({
    url: '/apiproxy/a1/addressbook/groups',
    model: Group
});