var _ = require('underscore');

// takes an object and a property name, if the property is a function
// it returns the result, else returns just the property itself.
exports.getOrCallProperty = function (obj, propName) {
    if (_.isFunction(obj[propName])) {
        return obj[propName]();
    } else {
        return obj[propName] || '';
    }
};

// removes characters and leading ones
exports.cleanPhoneNumber = function (number) {
    var justNumbers = number.trim().replace(/\D/g, '');
    return justNumbers.replace(/^1/, '');
};