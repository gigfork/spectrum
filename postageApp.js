var request = require('request'),
    uuid = require('node-uuid');


var apiKey = 'h8DaHhinYTSUmuBZWTfncyqPjpWYydNj';

exports.sendFileShare = function (shareLink, email, cb) {
    request.post({
        url: 'https://api.postageapp.com/v.1.0/send_message.json',
        json: {
            api_key: apiKey,
            uid: uuid(),
            'arguments': {
                recipients: [email],
                headers : {
                    subject: "Shared file",
                    from: "sharing@lockbox.io"
                },
                content: {
                    "text/plain": shareLink
                }
            }
        }
    }, cb);
};