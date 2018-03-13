const pm2 = require('pm2');

const MessageService = require('./MessageService');

const utils = require('../utils');

// Connect to pm2 instance running on the server
module.exports = function(res) {
    return pm2.connect((connectError) => {
        if (connectError) {
            console.error(connectError);
            process.exit(2);
        }
        
        return pm2.list((listError, processList) => {
            if (listError) {
                console.error(listError);
                process.exit(2);
            }
    
            // Get only the variables we want
            const trimmedProcessList = processList.map(runningProcess => {
                // We use runningProcess variable instead of process because process is a global variable. Just in case
                return {
                    name: runningProcess.name,
                    memory: utils.readableFileSize(runningProcess.monit.memory),
                    memoryRaw: runningProcess.monit.memory,
                    cpu: `${runningProcess.monit.cpu}%`,
                    status: runningProcess.pm2_env.status,
                    uptime: utils.readableTime(runningProcess.pm2_env.pm_uptime)
                }
            });
    
            // Build and send the status of servers to Slack
            MessageService.writeServerStatusMessage(trimmedProcessList);
    
            // Also return the status of servers as a response
            res.statusCode = 200;
            return res.end(trimmedProcessList);
        });
    });
}