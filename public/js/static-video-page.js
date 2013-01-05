var Timer = function (el) {
    this.el = el;
};

Timer.prototype.render = function () {
    this.el.innerHTML = this.time;
    return this;
};
Timer.prototype.start = function () {
    this.startTime = Date.now();
    this.stopped = false;
    this.update();
};
Timer.prototype.update = function () {
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
};
Timer.prototype.stop = function () {
    this.time = '0:00:00';
    this.stopped = true;
    this.render();
};
Timer.prototype.zeroPad = function (num) {
    return ((num + '').length === 1) ? '0' + num : num;
};


$(function () {
    var json = decodeURIComponent(location.hash.split('#')[1]),
        parsed = JSON.parse(json);

    // set our avatar and caller name
    $('.callerAvatar').attr('src', parsed.picUrl);
    $('.callerName').text(parsed.name);

    // hang up button handler
    $('.callEnd').click(function () {
        window.call && window.call.hangup();
        window.timer && window.timer.stop();
        return false;
    });

    window.who = parsed;
});


window.phono = $.phono({
    apiKey: "7826110523f1241fcfd001859a67128d",            
    gateway: "gw.phono.com",
    connectionUrl: "http://bosh.spectrum.tfoundry.com:8080/http-bind",
    audio: {
        type: "webrtc",
        localContainerId: "localVideo",
        remoteContainerId: "remoteVideo"
    },
    onReady: function () {
        console.log('ready!');
        var json = decodeURIComponent(location.hash.split('#')[1]),
            parsed = JSON.parse(json);
        
        console.log('DECODED', parsed);

        window.timer = new Timer($('.callTime')[0]);
        window.timer.start();

        window.call = this.phone.dial('xmpp:' + parsed.sipAddress);
    },
    phone: {
        ringTone: "http://s.phono.com/ringtones/Diggztone_Marimba.mp3",
        onHangup: function () {
            this.timer.stop();
        },
        onError: function () {
            console.log('error', arguments);
        }
    },
    onError: function () {
        console.log('error', arguments);
    }
});