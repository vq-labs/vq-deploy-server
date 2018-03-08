require('dotenv').config();

const appRoot = require('app-root-path').path;
const path = require('path');
const http = require('http');
const createHandler = require('github-webhook-handler');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const Promise = require("bluebird");
const handler = createHandler({ path: process.env.GITHUB_HOOK_PATH, secret: process.env.GITHUB_HOOK_SECRET });
const { WebClient } = require('@slack/client');
const web = new WebClient(process.env.SLACK_API_TOKEN);
const DeploymentStrategies = require('./DeploymentStrategies.json');
const pm2 = require('pm2');
const channelID = 'C9KDSG82C'; //#marketplace_status

const PM2_STATUSES = {
    "online": {
        "color": "good",
        "message": (variables) => `:heavy_check_mark: [${variables.status.toUpperCase()}] ${variables.name} is running`
    },
    "stopped": {
        "color": "danger",
        "message": (variables) => `:heavy_exclamation_mark: [${variables.status.toUpperCase()}] ${variables.name} is stopped`
    },
    "stopping": {
        "color": "warning",
        "message": (variables) => `:interrobang: [${variables.status.toUpperCase()}] ${variables.name} is stopping`
    },
    "launching": {
        "color": "warning",
        "message": (variables) => `:interrobang: [${variables.status.toUpperCase()}] ${variables.name} is being launched`
    },
    "errored": {
        "color": "danger",
        "message": (variables) => `:bangbang: [${variables.status.toUpperCase()}] ${variables.name} has been errored`
    }
}

const DEPLOY_STATUSES = {
    "good": (repoName, branchName, start) => `:heavy_check_mark: [DEPLOY][${branchName}@${repoName}] Deploy completed in ${new Date().getTime() - start} miliseconds`,
    "danger": (repoName, branchName) => `:x: [DEPLOY][${branchName}@${repoName}] Deploy failed. Error: ${error}`,
}

const sendMessage = (message = "[VQ-DEPLOY-SERVER]", attachments = []) => {
    web.chat.postMessage(channelID, message, { attachments });
}

function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
}

function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);
  
    var interval = Math.floor(seconds / 31536000);
  
    if (interval > 1) {
      return interval + 'Y';
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
      return interval + 'M';
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
      return interval + 'D';
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
      return interval + 'h';
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
      return interval + 'm';
    }
    return Math.floor(seconds) + 's';
  }



const deploy = (repoName, branchName) => {

    if (repoName !== 'vq-deploy-server') {
        sendMessage(`[DEPLOY][${branchName}@${repoName}] Started running deployment scripts...`);
    }

    const folder = DeploymentStrategies[repoName].folder;
    const file = DeploymentStrategies[repoName][branchName];    
    const attachments = [];

    const start = new Date().getTime();
    exec(
        path.join(appRoot, '../', folder, file),
        {cwd: path.join(appRoot, '../', folder)},
        (error, stdout, stderr) => {
            console.log(`${stdout}`);
            console.log(`${stderr}`);
            if (error !== null) {
                attachments.push({
                    "fallback": DEPLOY_STATUSES.danger(repoName, branchName),
                    "color": "danger",
                    "title": DEPLOY_STATUSES.danger(repoName, branchName)
                });
                return sendMessage(``, { attachments })
            } else {
                attachments.push({
                    "fallback": DEPLOY_STATUSES.good(repoName, branchName, start),
                    "color": "good",
                    "title": DEPLOY_STATUSES.good(repoName, branchName, start)
                });
                return sendMessage(``, { attachments })
            }
        }
    );
};


 http.createServer((req, res) => {
    handler(req, res, (err) => {
        if (req.method === 'POST' && req.url === '/status') {
            return pm2.connect((err) => {
                if (err) {
                  console.error(err);
                  process.exit(2);
                }
                
                pm2.list(function(err, process_list) {

                    const processSummaries = process_list.map(process => {
                        return {
                            name: process.name,
                            memory: humanFileSize(process.monit.memory),
                            memoryRaw: process.monit.memory,
                            cpu: `${process.monit.cpu}%`,
                            status: process.pm2_env.status,
                            uptime: timeSince(process.pm2_env.pm_uptime)
                        }
                    });

                    const attachments = processSummaries.map(process => {
                        if (process.status === 'online') {
                            return {
                                "fallback": PM2_STATUSES[process.status].message(process),
                                "color": PM2_STATUSES[process.status].color,
                                "title": PM2_STATUSES[process.status].message(process),
                                "fields": [
                                    {
                                        "title": "Memory",
                                        "value": process.memory,
                                        "short": false
                                    },
                                    {
                                        "title": "CPU",
                                        "value": process.cpu,
                                        "short": false
                                    },
                                    {
                                        "title": "Status",
                                        "value": process.status.replace(/\b\w/g, l => l.toUpperCase()),
                                        "short": false
                                    },
                                    {
                                        "title": "Uptime",
                                        "value": process.uptime,
                                        "short": false
                                    }
                                ]
                            }
                        } else {
                            return {
                                "fallback": PM2_STATUSES[process.status].message(process),
                                "color": PM2_STATUSES[process.status].color,
                                "title": PM2_STATUSES[process.status].message(process)
                            }
                        }
                    })
                    sendMessage(`*[SERVER STATUS]* Listing all PM2 instances`, attachments);
                    res.statusCode = 200;
                    return res.end();
                  });
              });
        } else {
            res.statusCode = 404
            return res.end('no such location')
        }
    });
}).listen(process.env.SERVER_PORT);

console.log(`[VQ-DEPLOY-SERVER] has started running on port ${process.env.SERVER_PORT}`);

handler.on('error', (err) => {
  console.error('Error:', err.message);
})

handler.on('push', (event) => {
    const repoName = event.payload.repository.name;
    const branchName = event.payload.ref.replace("refs/heads/", "");

    deploy(repoName, branchName);
});