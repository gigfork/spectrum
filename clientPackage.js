var stitch = require('stitch');


module.exports = stitch.createPackage({
    paths: [__dirname + '/clientapp', __dirname + '/clientmodules'],
    dependencies: [
        __dirname + '/public/jslibs/jquery.js',
        __dirname + '/public/jslibs/jquery-ui-1.9.2.custom.js',
        __dirname + '/public/jslibs/jquery.quickfilter.js',
        __dirname + '/public/jslibs/md5.js',
        __dirname + '/public/jslibs/noTapDelay.js',
        __dirname + '/public/jslibs/ui.js',
        __dirname + '/public/jslibs/spin.min.js',
        __dirname + '/public/jslibs/sugar.dates.min.js',
        __dirname + '/public/jslibs/clicky.js',
        __dirname + '/node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js'
    ]
});
