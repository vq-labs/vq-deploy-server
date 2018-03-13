const PM2Service = require('./services/PM2Service');

module.exports = function(error, req, res) {
    if (req.method === 'POST' && req.url === '/status') {
        if (process.env.SLACK_SERVER_STATUS) {
            return PM2Service(res);
        }
        
        return false;
    } else {
        res.statusCode = 404;
        return res.end('No such path exists');
    }
}