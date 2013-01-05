/*global google Spinner*/
var PageView = require('pages/base'),
    ich = require('icanhaz'),
    _ = require('underscore'),
    phoney = require('phoney');


module.exports = PageView.extend({
    events: {
    },
    render: function () {
        var self = this, 
            context = this.model.toTemplate();
        context.phoneNumber = phoney.stringify(app.me.get('phone_number')); 
        this.setElement(ich.locationPage(context));
        this.handleBindings();
        this.spinnerVisible(true);
        this.on('show', this.initMap, this);

        return this;
    },
    spinnerVisible: function (bool) {
        var found = this.$('.found'),
            looking = this.$('.locating');
        if (bool) {
            looking.show();
            found.hide();
            this.spinner = new Spinner({
                lines: 13,
                length: 4,
                width: 2, 
                radius: 4,
                rotate: 0,
                color: '#000',
                speed: 1,
                trail: 43,
                shadow: false,
                hwaccel: false,
                className: 'spinner',
                zIndex: 2000,
                top: 'auto',
                left: 'auto'
            }).spin(this.$('.spinTarget')[0]);
        } else {
            looking.hide();
            found.show();
            this.spinner.stop();
        }
    },
    initMap: function () {
        this.map = new google.maps.Map(this.$('.mapContainer')[0], {
            center: new google.maps.LatLng(37.4430981, -122.1578755),
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        this.plotMyLocation();
    },
    plotMyLocation: function () {
        var self = this;
        app.me.getMyLocation(function (latLong) {
            self.spinnerVisible(false);
            self.map.panTo(latLong);
            self.map.setZoom(15);
            self.meMarker = new google.maps.Marker({
                map: self.map,
                draggable: true,
                animation: google.maps.Animation.DROP,
                position: latLong
            });
        });
    }
});