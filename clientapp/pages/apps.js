var PageView = require('pages/base'),
    ich = require('icanhaz'),
    _ = require('underscore');


module.exports = PageView.extend({
    events: {
        'click a.de-authorize': 'handleDeAuthClick'
    },
    render: function () {
        var newEl = ich.appsPage({apps: app.apps.toJSON()});
        this.$el.replaceWith(newEl);
        this.setElement(newEl);
        this.ensureApps();
        return this;
    },
    ensureApps: function () {
        if (app.apps.length) return;
        this.refresh();
    },
    refresh: function () {
        app.apps.fetch({success: _.bind(this.render, this)});
    },
    handleDeAuthClick: function (e) {
        var id = $(e.target).data('id'),
            self = this;

        /*
        if (id){
            $.ajax({
                url: 'https://auth.tfoundry.com/users/592/authorizations/unauthorize_app?app_id=' + id, 
                success: function () {
                    self.refresh();
                },
                error: function () {
                    console.log(arguments);
                },
                global: false
            });
        }
        */

        return false;
    }
});