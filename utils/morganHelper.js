const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
//logs
let date = new Date();
const accessLogStream = fs.createWriteStream(
    path.join(
        __dirname,
        '..',
        'logs',
        `logs-${date.getDate()}-${
            date.getMonth() + 1
        }-${date.getFullYear()}.log`
    ),
    {
        flags: 'a',
    }
);

module.exports = morgan(
    function (tokens, req, res) {
        return [
            tokens.date('clf'),
            tokens.method(req, res),
            tokens.url(req, res),
            tokens.status(req, res),
            tokens.res(req, res, 'content-length'),
            '-',
            tokens['response-time'](req, res),
            'ms',
            req.user ? req.user.name : 'unknown user',
            tokens['user-agent'](req, res),
        ].join(' ');
    },
    { stream: accessLogStream }
);
