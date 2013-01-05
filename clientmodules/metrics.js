// This is just an abstraction for metrics tracking so we can easily swap
// out for some other tool if we want.
/*global mixpanel*/
module.exports = {
    doTrack: function () {
        //return true;
        return window.location.host === 'spectrum.io';
    }(),
    track: function (eventType, metadata) {
        if (this.doTrack) {
            mixpanel.track(eventType, metadata);
            _kmq.push(['record', eventType, metadata]);
        }
    },
    identify: function (who) {
        if (this.doTrack) {
            mixpanel.identify(who);
            _kmq.push(['identify', who]);
        }
    },
    pageView: function (url) {
        if (this.doTrack) {
            mixpanel.track_pageview(url);
            _kmq.push(['record', 'pageView', {url: url}]);
        }
    }
};