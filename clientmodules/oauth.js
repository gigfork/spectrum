var _ = require('underscore');

    
/*global settings*/
module.exports = {
    login: function () {
        var cb;
        if (window.settings.cordova) {
            cb = this.cb = window.plugins.childBrowser;
            cb.onLocationChange = _.bind(this.handleCBLocationChange, this);
            cb.onClose = _.bind(this.handleCBClose, this);
            cb.onOpenExternal = _.bind(this.handleCBOpenExternal, this);
            cb.showWebPage(this.getOauthUrl());
        } else {
            window.location = this.url();
        }
    },
    logout: function () {
        var self = this;
        if (settings.cordova) {
            if (this.cb) {
                this.logoutFrame = $('<iframe src="https://auth.tfoundry.com/logout" height="0" width="0">');
                $('body').append(this.logoutFrame);
                setTimeout(function () {
                    self.logoutFrame.remove();
                }, 1000);
                this.cb.close();
            }
            app.wipeData();
        } else {
            window.location = "/logout";
        }
    },
    baseUrl: 'https://auth.tfoundry.com',
    callbackUri: function () {
        return encodeURIComponent('https://spectrum.alpha-api.com/oauth-callback');
    },
    url: function () {
        if (settings.cordova) {
            return this.getOauthUrl();
        } else {
            return '/auth';
        }
    },
    // this is for the cordova version
    getOauthUrl: function () {
        return this.baseUrl + '/oauth/authorize?client_id=' + settings.oAuthClientId + '&redirect_uri=' + this.callbackUri() + '&client_secret=' + settings.oAuthSecret + '&scope=profile%2Caddressbook%2Clocker%2Cmessages%2Cgeo&response_type=token';
    },
    handleCBLocationChange: function(loc){ 
        var spectrumUrl = 'https://spectrum.alpha-api.com',
            meUrl = 'https://auth.tfoundry.com/me';

        if (loc.substr(0, spectrumUrl.length) === spectrumUrl) {
            var token = unescape(loc).split('=')[1];
            console.log('access_token: ' + token);
            localStorage.accessToken = token;
            app.set({
                accessToken: token,
                authStatus: 'authed'
            });
            app.getData();
            this.cb.close();
        } else if (loc.substr(0, meUrl.length) === meUrl) {
            console.log('calling login again');
            this.cb.getPage(this.getOauthUrl());
        }
    },
    handleCBClose: function () {
        console.log('child browser closed');
    },
    handleCBOpenExternal: function (loc) {
        console.log('open extenal');
    }
};