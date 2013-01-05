/*global MD5*/
module.exports = function (email, opts) {
    var config = {
            fallback: false,
            size: 100,
        },
        res,
        item;

    // extend our default config with options if passed
    if (typeof opts === 'object') {
        for (item in opts) {
            config[item] = opts[item];
        }
    }
    res = 'https://secure.gravatar.com/avatar/' + MD5.hexdigest(email) + '.png?s=' + config.size;
    if (config.fallback) res += 'd=' + encodeURIComponent(config.fallback);
    return res;
};