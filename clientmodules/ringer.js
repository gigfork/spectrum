/* global */
(function () {
  var cleanRegEx = /\D/g,
    clean = function () {
      if (window.ATT) {
        return window.ATT.phoneNumber.parse;
      } else {
        return function (s) {
          return s.replace(cleanRegEx, '').toString();
        }
      }
    }();

  var Ringer = function (phone, opts) {
    var options = opts || {},
      key;
    
    // phone
    this.registerPhoneHandlers(phone);

    // defaults
    this.config = {
      ringtone: 'https://js.att.io/sounds/ringtone.wav',
      ringbackTone: 'https://js.att.io/sounds/calling.wav',
      ringtones: {},
      ringbackTones: {},
      delay: 20
    };

    this.sounds = {};

    for (key in options) {
      this.config[key] = options[key];
    }

    // load any passed in ringtones and ringbacktones
    for (key in this.config.ringtones) {
      this.loadFile(this.config.ringtones[key], clean(key), this.config.delay);
    }
    for (key in this.config.ringbackTones) {
      this.loadFile(this.config.ringbackTones[key], clean(key), this.config.delay);
    }

    // load defaults
    this.loadFile(this.config.ringtone, 'ringtone', this.config.delay);
    this.loadFile(this.config.ringbackTone, 'ringbackTone', this.config.delay);
  };
  
  Ringer.prototype.registerPhoneHandlers = function (phone) {
    var self = this;
    phone.on('calling', function (number) {
      self.ringback(number);
    });
    phone.on('incomingCall', function (call, phoneNumber) {
      self.ring(phoneNumber);
    });
    phone.on('callBegin', function () {
      self.stopAll();
    });
    phone.on('callEnd', function () {
      self.stopAll();
    });
  };

  Ringer.prototype.loadFile = function (url, delay) {
    var self = this;

    setTimeout(function () {
      var a = new Audio();
      a.src = url;
      a.loop;
      // make sure we loop
      a.addEventListener('ended', function () {
        a.currentTime = 0;
        a.play();
      }, false);
      a.load();
      self.sounds[url] = a;
    }, delay || 0);
  };

  Ringer.prototype.play = function (name) {
    var sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  };

  Ringer.prototype.stop = function (name) {
    var sound = this.sounds[name];
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }; 

  Ringer.prototype.getRing = function (name) {
    return this.config.ringtones[clean(name)] || this.config.ringtone;
  };

  Ringer.prototype.getRingback = function (name) {
    return this.config.ringbackTones[clean(name)] || this.config.ringbackTone;
  };

  Ringer.prototype.stopRing = function (name) {
    this.stop(this.getRing(name));
  };

  Ringer.prototype.stopRingback = function (name) {
    this.stop(this.getRingback(name));
  };

  Ringer.prototype.ring = function (number) {
    return this.play(this.getRing(number));
  };

  Ringer.prototype.ringback = function (number) {
    return this.play(this.getRingback(number));
  };

  Ringer.prototype.stopAll = function () {
    for (var sound in this.sounds) {
      this.stop(sound);
    }
  };

  // attach to window or export with commonJS
  if (typeof exports !== 'undefined') {
      module.exports = Ringer;
  } else {
      window.Ringer = Ringer;
  }

})();
