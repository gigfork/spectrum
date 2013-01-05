var Backbone = require('backbone'),
    _ = require('underscore');


module.exports = Backbone.Collection.extend({
    fetch: function () {
        this.trigger('fetch');
        Backbone.Collection.prototype.fetch.apply(this, arguments);
    },
    sync: function (method, model, options) {
        // always tack on our accessToken if not already defined
        options.data = options.data || {};
        _.defaults(options.data, {
            access_token: app.get('accessToken')
        });
        Backbone.sync.call(this, method, model, options);
    }
});