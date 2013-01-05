var BaseView = require('views/base'),
    getProp = require('helpers/util').getOrCallProperty,
    _ = require('underscore');


module.exports = BaseView.extend({
    show: function () {
        var title = getProp(this, 'title'),
            currentPathname = window.location.pathname,
            self = this;

        if (title) {
            // set the document title
            document.title = title + ' • spectrum.io';
        } else {
            document.title = 'spectrum.io';
        }

        // store reference to current page
        app.currentPage = this;
        // scroll page to top
        $('body').scrollTop(0);
        // set the class so it comes into view
        $(this.el).addClass('active');
        
        // trigger an event to the page model in case we want to respond
        this.trigger('show');
        
        $('.selectView a').each(function () {
            if (self.matchesPath(currentPathname, this.pathname)) {
                $(this).addClass('selected');
            } else {
                $(this).removeClass('selected');
            }
        });        

        return this;
    },
    hide: function () {
        var self = this;
        // hide the page
        $(this.el).removeClass('active');
        // tell the model we're baling
        this.trigger('hide');
        // unbind all events bound for this view
        this.unbindomatic();
        // remove the element once it's animated out
        $(self.el).unbind().remove();
        return this;
    },
    matchesPath: function (pathname, navpath) {
        // split out the urls into arrays, remove falsy values in case there's a leading or trailing slash
        var navArray = _.compact(navpath.split('/')),
            pathArray = _.compact(pathname.split('/'));
        
        // trim it to the length of the one we're matching
        pathArray = _.first(pathArray, navArray.length);
        
        return _.isEqual(pathArray, navArray);
    }
});