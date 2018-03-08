const { WebClient } = require('@slack/client');

export class Slack {
    constructor(isOn, token, channelID) {
        this.isOn = isOn;
        this.web = new WebClient(token);
        this.channelID = channelID; //#marketplace_status
    }

    sendMessage = (message = ``, attachments = []) => {
        if (this.isOn) {
            this.web.chat.postMessage(this.channelID, message, { attachments });
            console.log('[DEPLOY] Sending message to Slack', JSON.stringify({ message, attachments }, null, 2));
        }
    }
}