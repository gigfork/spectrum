var BaseCollection = require('models/baseCollection'),
    App = require('models/app'),
    _ = require('underscore');


module.exports = BaseCollection.extend({
    model: App,
    url: function () {
        return '/apiproxy/a1/oauth/apps';
    },
    parse: function (res) {
        // fills in bad data
        _.each(res.apps, function (app) {
            if (!app.icon_thumb || app.icon_thumb.charAt(0) === '/') app.icon_thumb = 'https://apimatrix.tfoundry.com/icons/thumb/missing.png';
            return;
        });
        return res.apps;
    }
});