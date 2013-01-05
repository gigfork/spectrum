/*global ui Spinner*/
var PageView = require('pages/base'),
    FileView = require('views/file'),
    FileTypeView = require('views/fileType'),
    ich = require('icanhaz'),
    _ = require('underscore');


module.exports = PageView.extend({
    events: {
        'dragover': 'handleDragOver',
        'click #addFile': 'handleAddFileClick'
    },
    render: function () {
        var self = this;
        this.setElement(ich.filePage(this.model.toTemplate()));
        app.files.each(function (model) {
            self.handleAddFile(model);
        });
        this.$('.files').listFilter(this.$('#search'));
        
        this.bindomatic(app.files, 'add', this.handleAddFile);
        this.bindomatic(app.files, 'reset', this.handleFilesReset);

        var spin = _(this.showSpinner).bind(this);
        _.delay(spin, 200);
        
        return this;
    },
    handleAddFile: function (model, collection) {
        var view = new FileView({
            model: model
        });
        view.parent = this;
        this.$('.files').append(view.render().el);
    },
    handleFilesReset: function () {
        var self = this;
        this.$('.files').empty();
        app.files.each(function (model) {
            self.handleAddFile(model);
        });

        // stop loading spinner
        this.spinner.stop();
    },
    showSpinner: function () {
        var spinnerContainer = $('<li class="file" id="spinnerList"><a>&nbsp;&nbsp;</a></li>'),
            listEl = this.$('.files');
        if (listEl.is(':empty')) {
            listEl.append(spinnerContainer);

            this.spinner = new Spinner({
                lines: 9,
                length: 4,
                width: 2,
                radius: 3,
                zIndex: 0
            });
            this.spinner.spin(spinnerContainer[0]);
        }
    },
    handleDragOver: function () {
        if (!this.dialog) this.showUploadDialog();
    },
    handleDragEnd: function () {
        
    },
    handleDropZoneClick: function () {
        $('#fileInput')
            .click()
            .change(_(this.handleFileSelected).bind(this));

    },
    handleAddFileClick: function (e) {
        e.preventDefault();
        this.showUploadDialog();
    },
    handleFileSelected: function (e) {
        e.preventDefault();
        var file = $('#fileInput')[0].files[0];
        this.sendFile(file);
    },
    sendFile: function (file) {
        $.ajax({
            type: 'post',
            url: '/uploadproxy/locker/object?name=' + (file.fileName || file.name),
            data: file,
            success: function () {
                app.files.fetch();
            },
            xhrFields: {
                onprogress: function (progress) {
                    var percentage = Math.floor((progress.loaded / progress.total) * 100);
                }
            },
            /*
            xhr: function () {
                var req = new XMLHttpRequest();
                req.addEventListner("progress", function (progress) {
                    console.log('progress', arguments);
                }, false);
                return req;
            },
            */
            processData: false,
            contentType: file.type
        });
        
        ui.dialog('Starting upload').overlay().show().hide(1500);
    },
    showUploadDialog: function (model) {
        var self = this,
            snippet = ich.uploadDialog({file: model && model.toTemplate()}),
            dropZoneEl = $(snippet).find('#dropZone');

        dropZoneEl[0].ondrop = function (e) {
            e.preventDefault();
            self.sendFile(e.dataTransfer.files[0]);
            return false;
        };

        dropZoneEl.click(_(this.handleDropZoneClick).bind(this));

        this.dialog = new ui.Dialog({
                title: 'Let\'s upload a file!',
                message: snippet
            })
            .on('hide', function () {
                delete self.dialog;
            })
            .overlay()
            .show()
            .closable();
    },
    showContactShareDialog: function (contact, file) {
        ui
            .dialog("Sharing with " + contact.fullName(), ich.sharingOptions(contact.toForm()))
            .on('show', function () {
                $('#dialog').delegate('button', 'click', function (e) {
                    var self = $(this),
                        email = function () {
                            if (self.hasClass('workPhone') || self.hasClass('homePhone')) {
                                return self.text() + '@txt.att.net';
                            } else {
                                return self.text();
                            }
                        }();
                    file.share(email);
                });
            })
            .overlay()
            .show();
    }
});