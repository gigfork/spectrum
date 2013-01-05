/*global NoClickDelay console*/
var PageView = require('pages/base'),
    _ = require('underscore'),
    ich = require('icanhaz'),
    IHazForm = require('ihazform'),
    contactForm = require('forms/contactForm');


module.exports = PageView.extend({
    render: function () {
        // grab our form definition and add handlers
        var spec = contactForm.getSpec(),
            context = this.model.toForm();
        spec.submit = _(this.handleFormSubmit).bind(this);
        spec.cancel = _(this.handleFormCancel).bind(this);
        spec.data = context;
        // render main page
        
        this.setElement(ich.contactForm(context));
        
        // build the form and add it
        this.form = new IHazForm(spec);
        this.$('form').replaceWith(this.form.render());
        
        return this;
    },

    handleFormSubmit: function (vals) {
        var self = this;

        app.set('loadingDialog', 'Updating contact...');
        this.model.save(vals, {
            wait: true,
            success: function (err, data) {
                app.contacts.fetch({
                    success: function () {
                        app.set('loadingDialog', '');
                        app.showContact(data && data.id);
                    },
                    error: function () {
                        app.set('loadingDialog', '');
                        console.error('Something failed', arguments);
                    }
                });
            },
            error: function () {
                console.log('error', arguments);
            }
        });
    },

    handleFormCancel: function () {
        app.navigate('/');
    }
});