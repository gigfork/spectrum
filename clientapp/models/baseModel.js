var Backbone = require('backbone'),
    _ = require('underscore');


module.exports = Backbone.Model.extend({
    toTemplate: function () {
        var result = this.toJSON(),
            self = this;
        
        result.htmlId = this.cid;
        if (this.templateHelpers) {
            _.each(this.templateHelpers, function (val) {
                result[val] = self[val]();
            });
        }
        if (this.relationships) {
            _.each(this.relationships, function (val, key) {
                var rel = this.getRelated(key);
                result[key] = (rel && rel.toTemplate) ? rel.toTemplate() : '';
            }, this);
        }
        return result;
    },
    toggle: function (property) {
        this.set(property, !this.get(property));
    },
    sync: function (method, model, options) {
        options.url = model.url() + '?access_token=' + app.get('accessToken');
        Backbone.sync.call(this, method, this, options);
    }
});