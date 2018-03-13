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

                const trimmedProcess = {
                    name: runningProcess.name,
                    memory: utils.readableFileSize(runningProcess.monit.memory),
                    memoryRaw: runningProcess.monit.memory,
                    cpu: `${runningProcess.monit.cpu}%`,
                    status: runningProcess.pm2_env.status,
                    uptime: utils.readableTime(runningProcess.pm2_env.pm_uptime)
                };
                
                const server = MessageService.messages.server.status[trimmedProcess.status];

                // Set dynamic values for the message
                return Object.assign(
                    {},
                    server, // initial server object is only consists of title and color
                    {
                        title: server.title(trimmedProcess), 
                        fallback: server.title(trimmedProcess), // fallback is the same as title so no need to include it in MESSAGES
                        // if the status is online meaning there will be some statistics such as
                        // CPU, memory usage and uptime so they will be shown as attachments
                        // otherwise nothing will be shown other than the status of the server
                        fields: trimmedProcess.status === 'online' ?
                            MessageService.messages.server.status.details(trimmedProcess) :
                            []
                    }
                )
            });
    
            // You can access the status API by doing a POST request to /status
            // Slack does this so if you return an object with the structure it expects
            // It outputs a compiled Slack message (with attachments)
            res.writeHead(200, {"Content-Type": "application/json"});

            return res.end(
                JSON.stringify({
                    response_type: 'ephemeral',
                    text: MessageService.messages.server.status.title,
                    attachments: trimmedProcessList
                })
            );
        });
    });
}