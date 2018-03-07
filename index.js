require('dotenv').config();

const appRoot = require('app-root-path').path;
const path = require('path');
const http = require('http');
const createHandler = require('github-webhook-handler');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const Promise = require("bluebird");
const handler = createHandler({ path: process.env.GITHUB_HOOK_PATH, secret: process.env.GITHUB_HOOK_SECRET });
const { IncomingWebhook } = require('@slack/client');
const webhook = new IncomingWebhook(process.env.SLACK_HOOK_URL);

const sendMessage = (message) => {
    webhook.send(message, function(err, res) {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Message sent: ', res);
        }
    });
}

const DeploymentStrategies = {
    "vq-deploy-server": {
        "name": "DEPLOY SERVER",
        "folder": "vq-deploy-server",
        "master": "deploy.sh"
    },
    "vq-marketplace-platform": {
        "name": "API",
        "folder": "vq-marketplace-api",
        "master": "deploy.sh"
    },
    "vq-marketplace-web-app": {
        "name": "APP",
        "folder": "vq-marketplace-web-app",
        "master": "deploy.sh"
    },
    "vq-marketplace-landing-page": {
        "name": "LANDING PAGE",
        "folder": "vq-marketplace-landing-page",
        "master": "deploy.sh",
        "VM-32": "deploy.sh"
    },
    "vq-labs.com": {
        "name": "VQ-LABS.COM",
        "folder": "vq-labs.com",
        "master": "deploy.sh"
    },
    "vqmarketplace.com": {
        "name": "VQMARKETPLACE.COM",
        "folder": "vqmarketplace.com",
        "VM-32": "deploy.sh"
    }
}

const deploy = (repoName, branchName) => {
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
};


http.createServer((req, res) => {
    handler(req, res, (err) => {
        res.statusCode = 404
        res.end('no such location')
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