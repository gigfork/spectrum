// A phone number parser/stringifier
// two methods:
// stringify() takes any string and attempts to parse it and turn it into a cleanly
// displayable phone number. This includes parsing the incoming text which converts
// letters to corresponding numbers, etc.
(function () {
  var root = this.require || this.jQuery || this.Zepto || this.ender || this;
  
  function stringify(text) {
    // strip all non numbers
    var cleaned = parse(text),
      len = cleaned.length,
      countryCode = (cleaned.charAt(0) === '1'),
      arr = cleaned.split(''),
      diff;

    // if it's long just return it unformatted
    if (len > (countryCode ? 11 : 10)) return cleaned;

    // if it's too short to tell
    if (!countryCode && len < 4) return cleaned;

    // remove country code if we have it
    if (countryCode) arr.splice(0, 1);

    // the rules are different enough when we have
    // country codes so we just split it out
    if (countryCode) {
      if (len > 1) {
        diff = 4 - len;
        diff = (diff > 0) ? diff : 0;
        arr.splice(0, 0, " (");
        // back fill with spaces
        arr.splice(4, 0, (new Array (diff + 1).join(' ') + ") "));
        
        if (len > 7) {
          arr.splice(8, 0, '-');
        }
      }
    } else {
      if (len > 7) {
        arr.splice(0, 0, "(");
        arr.splice(4, 0, ") ");
        arr.splice(8, 0, "-");
      } else if (len > 3) {
        arr.splice(3, 0, "-");
      }
    }

    // join it back when we're done with the CC if it's there
    return (countryCode ? '1' : '') + arr.join('');
  }

  function parse(input) {
    return String(input)
      .toUpperCase()
      .replace(/[A-Z]/g, function(l) {
        return (l.charCodeAt(0)-65)/3+2-("SVYZ".indexOf(l)>-1)|0;
      })
      .replace(/\D/g, '');
  }

  function getCallable(input, countryAbr) {
    var country = countryAbr || 'us',
        cleaned = parse(input);
      if (cleaned.length === 10) {
        if (country == 'us') {
          return '1' + cleaned;
        }
      } else if (country == 'us' && cleaned.length === 11 && cleaned.charAt(0) === '1') {
        return cleaned;
      } else {
        return false;
      }
  }

  var phoneNumber = {
    parse: parse,
    stringify: stringify,
    getCallable: getCallable
  };

  // if we've in CommonJS just export it as main export otherwise, export as "phoneNumber"
  if (typeof require !== 'undefined') {
    module.exports = phoneNumber; 
  } else {
    root.phoneNumber = phoneNumber;
  }
}.call(this));