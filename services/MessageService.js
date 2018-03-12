const _get = require('lodash.get');

const SlackService = require('./SlackService');
const Slack = new SlackService(
    process.env.SLACK, // if not set to true, Slack will stay silent and the server will only log to console
    process.env.SLACK_API_TOKEN,
    process.env.SLACK_CHANNEL_ID
);

const MESSAGES = require('../constants/MESSAGES');

class MessageService {
    constructor() {

        // These are used to get messages quickly from MESSAGES
        this.server = {
            start: 'server.start',
            error: 'server.error',
            status: 'server.status'
        }

        this.runtime = {
            start: 'runtime.start',
            error: 'runtime.error',
            success: 'runtime.success'
        }
    }

    setAttributes(attributes) { return this.attributes = attributes; }
    getAttributes() { return this.attributes; } 

    writeMessage(title, path, variables) {
        if (!title) {
            title = ``;
        }

        // Slack expects the attachments to be an array
        let attachments = [];

        if (typeof path === 'string') {
            // if only a string is passed as path
            // it gets the corresponding message template from MESSAGES
            let message = _get(MESSAGES, path);
    
            attachments.push(
                Object.assign(
                    {},
                    message, // the color already exists in the message object
                    {
                        title: message.title(variables),
                        fallback: message.title(variables) // fallback is the same as title
                    }
                )
            );
        } else if (Array.isArray(path)) {
            // if the path is an array (an example can be seen in writeStatusMessage function)
            // we just send the already provided attachments
            attachments = path;
        }

        Slack.sendMessage(title, attachments);
        // Slack handles the empty title but console does not
        // it will print undefined so
        if (title !== '') {
            console.log(title, JSON.stringify(attachments, null, 2));
        } else {
            console.log(JSON.stringify(attachments, null, 2));
        }
    }

    writeStatusMessage(processList) {
        // Attachment API of Slack is used to display server information because they seem less like a 'message'
        // and they also include some coloring that can be used for the status
        const servers = processList.map(runningProcess => {
            // Get the message for the matching status of the process
            const server = MESSAGES.server.status[runningProcess.status];

            // Set dynamic values for the message
            return Object.assign(
                {},
                server, // initial server object is only consists of title and color
                {
                    title: server.title(runningProcess), 
                    fallback: server.title(runningProcess), // fallback is the same as title so no need to include it in MESSAGES
                    // if the status is online meaning there will be some statistics such as
                    // CPU, memory usage and uptime so they will be shown as attachments
                    // otherwise nothing will be shown other than the status of the server
                    fields: runningProcess.status === 'online' ?
                        MESSAGES.server.status.details(runningProcess) :
                        []
                }
            )
        });

        return this.writeMessage(MESSAGES.server.status.title, servers);
    }

}

// Export instance of MessageService as singleton
module.exports = new MessageService();