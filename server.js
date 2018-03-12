require('dotenv').config();

const path = require('path');
const http = require('http');
const exec = require('child_process').exec;

const APP_NAME = process.env.APP_NAME;
const SERVER_PORT = process.env.SERVER_PORT;

// # HOOKS
const createWebhookHandler = require('github-webhook-handler');
// Initialize webhook handler
const WebhookHandler = createWebhookHandler({ path: process.env.GITHUB_HOOK_PATH, secret: process.env.GITHUB_HOOK_SECRET });


// # MESSAGES
// Get initialized singleton class of MessageService
const MessageService = require('./services/MessageService');

// MessageService is a singleton so set its attributes
MessageService.setAttributes({appName: APP_NAME, port: SERVER_PORT});


// # DEPLOY
const DeployService = require('./services/DeployService');


// # ROUTES
const routes = require('./routes');


// # SERVER
http
    .createServer((req, res) => {
        return WebhookHandler(
            req,
            res,
            routes // Handle routes that are not equal to GITHUB_HOOK_PATH
        );
    })
    .listen(SERVER_PORT, () => {
        // Server start message
        return MessageService.writeMessage(
            undefined,
            MessageService.server.start,
            {
                appName: APP_NAME,
                port: SERVER_PORT 
            }
        );
    });


WebhookHandler.on('error', (error) => {
    // Handle Errors
    return MessageService.writeMessage(
        undefined,
        MessageService.server.error,
        {
            appName: APP_NAME,
            error
        }
    );
})
 
WebhookHandler.on('push', (event) => {
    const repoName = event.payload.repository.name;
    const branchName = event.payload.ref.replace("refs/heads/", "");

    // Deploy
    const deployer = new DeployService(repoName, branchName);
    return deployer.deploy();
});