var Backbone = require('backbone'),
    BaseView = require('views/base'),
    _ = require('underscore');


module.exports = BaseView.extend({
    render: function () {
        this.$el.html(this.time);
        return this;
    },
    start: function () {
        this.startTime = Date.now();
        this.stopped = false;
        this.update();
    },
    update: function () {
        if (this.stopped) return;
        
        var diff = Date.now() - this.startTime,
            s = Math.floor(diff / 1000) % 60,
            min = Math.floor((diff / 1000) / 60) % 60,
            hr = Math.floor(((diff / 1000) / 60) / 60) % 60,
            time = [hr, this.zeroPad(min), this.zeroPad(s)].join(':');
        
        if (this.time !== time) {
            this.time = time;
            this.render();
        }

        _.delay(_.bind(this.update, this), 100);
    },
    stop: function () {
        this.time = '0:00:00';
        this.stopped = true;
        this.render();
    },
    zeroPad: function (num) {
        return ((num + '').length === 1) ? '0' + num : num;
    }
});