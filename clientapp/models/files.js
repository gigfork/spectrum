var BaseCollection = require('models/baseCollection'),
    FileModel = require('models/file');


module.exports = BaseCollection.extend({
    url: '/apiproxy/a1/locker/object',
    model: FileModel,
    parse: function (response) {
        return response.files;
    }
});