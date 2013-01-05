/*global ui*/
var Backbone = require('backbone'),
    BaseModel = require('models/baseModel');


module.exports = BaseModel.extend({
    defaults: {
        progress: 0
    },
    templateHelpers: [
        'downloadUrl',
        'displayName'
    ],
    downloadUrl: function () {
        return this.url();
    },
    displayName: function () {
        return this.get('filename').split('/').slice(2)[0];
    },
    share: function (email, cb) {
        $.post('/share/' + this.id + '?email=' + email + '&access_token' + app.get('accessToken'), function (response) {
            if (!response.error) {
                ui.dialog('Shared!').show().hide(1500);
            } else {
                ui.dialog('Could not send').show().hide(2500);
            }
        });
    },
    url: function () {
        return Backbone.Model.prototype.url.call(this) + '?access_token=' + app.get('accessToken');
    }
});