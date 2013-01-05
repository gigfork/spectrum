/*global ui*/
var BaseView = require('views/base'),
    ich = require('icanhaz');


module.exports = BaseView.extend({
    events: {
        'click .deleteFile': 'handleDeleteClick',
        'click .updateFile': 'handleUpdateClick',
        'click .shareFile': 'handleShareClick'
    },
    render: function () {
        this.setElement(ich.fileItem(this.model.toTemplate()));
        this.$bar = this.$('.bar');
        this.$progress = this.$('.progress');
        this.bindomatic(this.model, 'change:progress', this.handleProgressChanged, {trigger: true});
        return this;
    },
    handleDeleteClick: function () {
        var self = this,
            dialog = ui
                .confirm('Delete file', 'Are you sure you want to delete "' + self.model.displayName() + '"?')
                .overlay()
                .show(function (ok) {
                    var thisDialog = this;
                    if (ok) {
                        self.$el.hide();
                        self.model.destroy({
                            success: function () {
                                self.remove();
                            },
                            error: function () {
                                self.$el.show();
                                ui
                                    .dialog('Something went wrong, try it again.')
                                    .overlay()
                                    .show();
                            }
                        });
                    } else {
                        ui.dialog('Cancelled').overlay().show().hide(1000);
                    }
                });
        
    },
    handleUpdateClick: function () {
        this.parent.showUploadDialog(this.model);
    },
    handleShareClick: function () {
        var self = this,
            context = {
                file: this.model.toJSON(),
                options: app.contacts.map(function (contact) {
                    return {
                        name: contact.fullName(),
                        value: contact.id
                    };
                })
            },
            dialog = ui.dialog('Share a file' + this.model.escape('name'), ich.fileShareDialog(context))
                .overlay()
                .closable()
                .on('show', function () {
                    var select = $('select', this.el),
                        button = $('button.share', this.el),
                        input = $('#shareInput', this.el);

                    input.focus();

                    select.change(function () {
                        var val = $(this).val();
                        if (val) {
                            input.attr('disabled', true);
                        } else {
                            input.attr('disabled', false);
                        }
                    });

                    button.click(function () {
                        if (!input.is('[disabled]') && input.val()) {
                            self.model.share(input.val());
                        } else if (select.val()) {
                            var user = app.contacts.get(select.val());
                            app.currentPage.showContactShareDialog(user, self.model);
                        } else {
                            return false;
                        }
                    });
                })
                .show();
    },
    handleProgressChanged: function () {
        var progress = this.model.get('progress');
        if (progress === 0 || progress === 100) {
            this.$bar.hide();
        } else {
            this.$bar.show();
            this.$progress.show().css('width', progress + '%');
        }
        
    }
});