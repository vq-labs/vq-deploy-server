const PM2ListHandler = require('./PM2ListHandlerService');

export default function(error, req, res) {
    if (req.method === 'POST' && req.url === '/status') {
        return PM2ListHandler(res);
    } else {
        res.statusCode = 404;
        return res.end('No such path exists');
    }
}