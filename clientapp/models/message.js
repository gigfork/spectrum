var BaseModel = require('models/baseModel'),
    _ = require('underscore');


module.exports = BaseModel.extend({
    initialize: function (attrs) {
        this.set('me', app.me.isMe(attrs.from));
    },
    getContact: function () {
        var from = this.get('from');
        return from && app.contacts.findByPhone(from);
    },
    toTemplate: function () {
        var res = {
                body: this.get('body'),
                type: this.get('type'),
                time: Date.create().format('{M}/{dd} {h}:{mm} {tt}')
            }, 
            attrs, 
            contact;
        
        if (this.get('me')) {
            attrs = app.me.toTemplate();
            _.extend(res, {
                from: attrs.name,
                picUrl: attrs.gravatar,
                me: true
            });
        } else {
            contact = this.getContact();
            if (contact) {
                _.extend(res, {
                    from: contact.fullName(),
                    picUrl: contact.toForm().picUrl
                });
            }
            
        }

        return res;
    }
});