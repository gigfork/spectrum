/*global Spinner ui*/
var BaseView = require('views/base'),
    _ = require('underscore'),
    ich = require('icanhaz');


module.exports = BaseView.extend({
    events: {
        'click .add': 'add',
        'click .contactItem': 'handleSelectClick'
    },
    initialize: function () {
        this.selected = [];
        this.render();
    },
    render: function (html) {
        this.$el.html(ich.addUserDialog({
            contacts: app.contacts.map(function (model) {
                return {
                    name: model.getContactName(),
                    online: model.get('online'),
                    number: model.getCallableNumber()
                };
            })
        }));
        this.dialog = ui.dialog('Add Users', this.el).overlay().closable().show();
        this.delegateEvents();
    },
    add: function () {
        var convo = app.currentPage.model;
        this.selected.forEach(function (phone) {
            app.chatSession.addUserToRoom(convo.id, phone);
        }); 
        this.dialog.hide();
    },
    handleSelectClick: function (e) {
        var id = $(e.target).data('number');
        if (_.contains(this.selected, id)) {
            this.selected = _.without(this.selected, id);
        } else {
            this.selected.push(id);
        }
        this.updateSelectionState();
    },
    updateSelectionState: function () {
        var self = this;
        this.$('.contactItem').removeClass('selected');
        this.selected.forEach(function (number) {
            self.$('.contactItem[data-number=' + number + ']').addClass('selected');
        });
    }
});
