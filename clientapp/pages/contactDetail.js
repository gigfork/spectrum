var PageView = require('pages/base'),
    ich = require('icanhaz'),
    phoney = require('phoney');


module.exports = PageView.extend({
    events: {
        'click .deleteContact': 'domDeleteClick',
        'click .editContact': 'domEditClick',
        'click .backToChat': 'domBackToChatClick',
        'click .call': 'handleCallClick'
    },
    classBindings: {
        'online': '.startActions'
    },
    subview: 'detail',
    render: function () {
        var context = this.model.toForm();
        context.detail = true;
        context.homePhone = phoney.stringify(context.homePhone);
        context.workPhone = phoney.stringify(context.workPhone);
        this.setElement(ich.contactsPage(context));
        this.handleBindings();
        return this;    
    },
    domEditClick: function () {
        this.model.editModel();
    },
    domDeleteClick: function () {
        this.model.confirmDelete();
    },
    handleStartVideo: function () {
        this.model.call();
    },
    domBackToChatClick: function () {
        this.model.viewChat();
    },
    handleCallClick: function (e) {
        app.call(this.model.cleanPhoneNumber($(e.target).text()));
    }
});
