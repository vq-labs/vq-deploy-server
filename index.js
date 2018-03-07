require('dotenv').config();

const http = require('http')
const createHandler = require('github-webhook-handler')
const spawn = require('child_process').spawn
const handler = createHandler({ path: process.env.HOOK_PATH, secret: process.env.HOOK_SECRET })

http.createServer((req, res) => {
    console.log(`[VQ-DEPLOY-SERVER] has started running on port ${process.env.SERVER_PORT}`);
  handler(req, res, (err) => {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(7777)

handler.on('error', (err) => {
  console.error('Error:', err.message)
})

handler.on('push', (event) => {
    const repoName = event.payload.repository.name;
    const branchName = event.payload.ref.replace("refs/heads/", "");
    if (branchName === process.env.HOOK_BRANCH) {
        console.log(`[VQ-DEPLOY-SERVER] received a push event for %s repository %s branch`, repoName, branchName);
    }

})

const npm = spawn("s3-deploy", args, { cwd: './build' });

npm.stdout.on('data', data => {
    console.log(`stdout: ${data}`);
});

npm.stderr.on('data', data => {
    console.log(`stderr: ${data}`);
});

npm.on('close', code => {
    cb(code !== 0 ? 'error in build' : null);
});