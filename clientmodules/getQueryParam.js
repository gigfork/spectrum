// query string parser
module.exports = function getParameterByName(name) {
    var cleaned = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]"),
        regexS = "[\\?&]" + cleaned + "=([^&#]*)",
        regex = new RegExp(regexS),
        results = regex.exec(window.location.search);
    return (results) ? decodeURIComponent(results[1].replace(/\+/g, " ")) : undefined;
};
