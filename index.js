require('dotenv').config();

const http = require('http');
const createHandler = require('github-webhook-handler');
const spawn = require('child_process').spawn;
const handler = createHandler({ path: process.env.GITHUB_HOOK_PATH, secret: process.env.GITHUB_HOOK_SECRET });
const { IncomingWebhook } = require('@slack/client');
const webhook = new IncomingWebhook(process.env.SLACK_HOOK_URL);

const runCommand = (cmd, args = [], cb, endCb) => {
    const process = spawn(cmd, args);

    process.stdout.on('data', data => {
        cb(data);
    });

    process.stderr.on('data', data => {
        cb(undefined, data);
    });

    process.on('close', code => {
        endCb(code !== 0 ? false : true);
    });
}

const sendMessage = (message) => {
    webhook.send(message, function(err, res) {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Message sent: ', res);
        }
    });
}

http.createServer((req, res) => {
    console.log(`[VQ-DEPLOY-SERVER] has started running on port ${process.env.SERVER_PORT}`);
    handler(req, res, (err) => {
        res.statusCode = 404
        res.end('no such location')
    });
}).listen(process.env.SERVER_PORT);

handler.on('error', (err) => {
  console.error('Error:', err.message);
})

handler.on('push', (event) => {
    const repoName = event.payload.repository.name;
    const branchName = event.payload.ref.replace("refs/heads/", "");
    if (branchName === process.env.GIT_HOOK_BRANCH) {
        sendMessage(`[VQ-DEPLOY-SERVER] received a push event for ${repoName} repository ${branchName} branch`);
        runCommand(
            'ls',
            ['-lh'],
            (data, err) => {
                if (err) {
                    console.log('ERR', err);
                }

                console.log('DATA', data);
            },
            success => {
                if (success) {
                    console.log('process success');
                }
            }
        );
    }
});