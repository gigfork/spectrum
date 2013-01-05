var BaseCollection = require('backbone'),
    FileTypeModel = require('models/fileType');


module.exports = BaseCollection.extend({
    model: FileTypeModel,
    initialize: function () {
        this.reset(require('fixtures/fileTypes'));
    }
});