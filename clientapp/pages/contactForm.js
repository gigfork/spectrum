/*global NoClickDelay console*/
var PageView = require('pages/base'),
    _ = require('underscore'),
    ich = require('icanhaz'),
    IHazForm = require('ihazform'),
    contactForm = require('forms/contactForm'),
    metrics = require('metrics');


module.exports = PageView.extend({
    render: function () {
        // grab our form definition and add handlers
        var spec = contactForm.getSpec(),
            self = this;
        spec.submit = _(this.handleFormSubmit).bind(this);
        spec.cancel = _(this.handleFormCancel).bind(this);
        
        // render main page
        this.setElement(ich.contactForm());
        
        // build the form and add it
        this.form = new IHazForm(spec);
        this.$('form').replaceWith(this.form.render());

        // focus on first input
        this.on('show', function () {
            self.$('#firstName').focus();
        });
        
        return this;
    },

    handleFormSubmit: function (vals) {
        app.set('loadingDialog', 'Creating new contact...');
        app.contacts.create(vals, {
            wait: true,
            success: function (model, data) {
                metrics.track('created new contact');
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
                metrics.track('creating new contact failed');
                app.set('loadingDialog', '');
                console.error('Something failed', arguments);
            }
        });
    },

    handleFormCancel: function () {
        app.navigate('/');
    }
});