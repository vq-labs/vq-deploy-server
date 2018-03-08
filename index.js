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

const sendMessage = (message) => {
    web.chat.postMessage(channelID, message)
  .then((res) => {
    // `res` contains information about the posted message
    console.log('Message sent: ', res.ts, res);
  })
  .catch(console.error);
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
                    //res.statusCode = 200;
                    console.log(process_list, err);
                    res.end(process_list);
                    return;
                  });
              });
        } else {
            res.statusCode = 404
            res.end('no such location')
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