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
        "message": (variables) => `[${variables.status.toUpperCase()}] ${variables.name} has been running for ${variables.uptime} with ${variables.cpu} CPU and ${variables.memory} RAM usage`
    },
    "stopped": {
        "color": "danger",
        "message": (variables) => `[${variables.status.toUpperCase()}] ${variables.name} is stopped`
    },
    "stopping": {
        "color": "warning",
        "message": (variables) => `[${variables.status.toUpperCase()}] ${variables.name} is stopping`
    },
    "launching": {
        "color": "warning",
        "message": (variables) => `[${variables.status.toUpperCase()}] ${variables.name} is being launched`
    },
    "errored": {
        "color": "danger",
        "message": (variables) => `[${variables.status.toUpperCase()}] ${variables.name} has been errored`
    }
}

const sendMessage = (message, attachments = []) => {
    web.chat.postMessage(channelID, message, { attachments })
  .then((res) => {
    // `res` contains information about the posted message
    console.log('Message sent: ', res.ts, res);
  })
  .catch(console.error);
}

function bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return 'n/a'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
    if (i === 0) return `${bytes} ${sizes[i]})`
    return `${(bytes / (1024 * i)).toFixed(1)} ${sizes[i]}`
  }

const convertMillisToTime = (millis) => {
    let delim = " ";
    let hours = Math.floor(millis / (1000 * 60 * 60) % 60);
    let minutes = Math.floor(millis / (1000 * 60) % 60);
    let seconds = Math.floor(millis / 1000 % 60);
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    return hours + 'h'+ delim + minutes + 'm' + delim + seconds + 's';
}

//sendMessage(`:grey_exclamation: [DEPLOY][${"test"}@${"test2"}] Started running deployment scripts...`);

/* const deploy = (repoName, branchName) => {

    sendMessage(`:grey_exclamation: [DEPLOY][${branchName}@${repoName}] Started running deployment scripts...`);

    const folder = DeploymentStrategies[repoName].folder;
    const file = DeploymentStrategies[repoName][branchName];

    const start = new Date().getTime();
    exec(
        path.join(appRoot, '../', folder, file),
        {cwd: path.join(appRoot, '../', folder)},
        (error, stdout, stderr) => {
            console.log(`${stdout}`);
            console.log(`${stderr}`);
            if (error !== null) {
                return sendMessage(`
                :x: [DEPLOY][${branchName}@${repoName}] Deploy failed. Error: ${error}
            `)
            } else {
                return sendMessage(`
                :heavy_check_mark: [DEPLOY][${branchName}@${repoName}] Deploy completed in ${new Date().getTime() - start} miliseconds
            `)
            }
        }
    );
}; */


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
                            memory: bytesToSize(process.monit.memory),
                            cpu: `${process.monit.cpu}%`,
                            status: process.pm2_env.status,
                            uptime: convertMillisToTime(process.pm2_env.pm_uptime)
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
                                        "value": process.status,
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
                    sendMessage(``, attachments);
                    res.statusCode = 200;
                    return res.end(JSON.stringify(processSummaries));
                  });
              });
        } else {
            res.statusCode = 404
            return res.end('no such location')
        }
    });
}).listen(process.env.SERVER_PORT);

/*console.log(`[VQ-DEPLOY-SERVER] has started running on port ${process.env.SERVER_PORT}`);

handler.on('error', (err) => {
  console.error('Error:', err.message);
})

handler.on('push', (event) => {
    const repoName = event.payload.repository.name;
    const branchName = event.payload.ref.replace("refs/heads/", "");

    deploy(repoName, branchName);
}); */