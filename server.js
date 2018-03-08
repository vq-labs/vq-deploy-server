require('dotenv').config();

const path = require('path');
const http = require('http');
const exec = require('child_process').exec;

const APP_NAME = process.env.APP_NAME;
const PORT = process.env.SERVER_PORT;

// # HOOKS
const createWebhookHandler = require('github-webhook-handler');
// Initialize webhook handler
const WebhookHandler = createWebhookHandler({ path: process.env.GITHUB_HOOK_PATH, secret: process.env.GITHUB_HOOK_SECRET });


// # MESSAGES
// Get initialized singleton class of MessageHandler
const MessageHandler = require('./MessageHandlerClass');

// MessageHandler is a singleton so set its attributes
MessageHandler.setAttributes({appName: APP_NAME, port: PORT});


// # DEPLOY
const DeployHandler = require('./DeployHandlerClass');


// # ROUTES
const RouteHandler = require('./RouteHandler');


// # SERVER
http
    .createServer((req, res) => {
        return WebhookHandler(
            req,
            res,
            (err, req, res) => RouteHandler // Handle routes that are not equal to GITHUB_HOOK_PATH
        );
    })
    .listen(process.env.SERVER_PORT, () => {
        // Server start message
        return MessageHandler.writeMessage(
            undefined,
            MessageHandler.server.start,
            {
                appName: APP_NAME,
                port: PORT 
            }
        );
    });


WebhookHandler.on('error', (error) => {
    // Handle Errors
    return MessageHandler.writeMessage(
        undefined,
        MessageHandler.server.error,
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
    const deployer = new DeployHandler(repoName, branchName);
    return deployer.deploy();
});