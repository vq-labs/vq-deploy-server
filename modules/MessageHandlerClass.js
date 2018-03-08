import { triggerAsyncId } from 'async_hooks';

const _get = require('lodash.get');

const SlackHandler = require('./SlackHandlerClass');
const Slack = new SlackHandler(process.env.SLACK.toLowerCase() === 'on' ? true : false, process.env.SLACK_API_TOKEN, process.env.SLACK_CHANNEL_ID);

const MESSAGES = require('../constants/MESSAGES');

class MessageHandler {
    constructor() {
        this.server = {
            start: 'server.start',
            error: 'server.error',
            status: 'server.status'
        }

        this.runtime = {
            start: 'run.start',
            error: 'run.error',
            success: 'run.success'
        }
    }

    setAttributes = (attributes) => this.attributes = attributes;
    getAttributes = () => this.attributes;

    writeMessage(message = ``, attachments, variables) {
        Slack.sendMessage()
        //if attachment is string
        //if attachment is array
        //console.log('[DEPLOY] Sending message to Slack', JSON.stringify({ message, attachments }, null, 2));
        //console.log here
        //stringify attachmentbody
    }

    writeStatusMessage(processList) {
        const attachments = processList.map(runningProcess => {
            const attachment = MESSAGES.server.status[runningProcess.status];
            return attachment = {
                ...attachment,
                title: attachment.title(runningProcess),
                fallback: attachment.fallback(runningProcess),
                fields: runningProcess.status === 'online' ?
                    MESSAGES.server.status.mergeFields(runningProcess) :
                    []

            }
        });

        return this.writeMessage(MESSAGES.server.status.title, attachments);
    }

}

// Export instance of MessageHandler as singleton
export let MessageHandler = new MessageHandler();