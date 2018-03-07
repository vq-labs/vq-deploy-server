require('dotenv').config();

var http = require('http')
var createHandler = require('github-webhook-handler')
var spawn = require('child_process').spawn
var handler = createHandler({ path: process.env.HOOK_PATH, secret: process.env.HOOK_SECRET })

http.createServer((req, res) => {
    console.log('this is test');
  handler(req, res, (err) => {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(7777)

handler.on('error', (err) => {
  console.error('Error:', err.message)
})

handler.on('push', (event) => {
  console.log('Received a push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref)
})

handler.on('issues', (event) => {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title)
})

var npm = spawn("s3-deploy", args, { cwd: './build' });

npm.stdout.on('data', data => {
    console.log(`stdout: ${data}`);
});

npm.stderr.on('data', data => {
    console.log(`stderr: ${data}`);
});

npm.on('close', code => {
    cb(code !== 0 ? 'error in build' : null);
});