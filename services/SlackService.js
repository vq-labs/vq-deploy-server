const { WebClient } = require('@slack/client');

module.exports = class SlackService {
    constructor(isOn, token, channelID) {
        this.isOn = isOn;
        this.web = new WebClient(token);
        this.channelID = channelID; //#marketplace_status
    }

    sendMessage(title, attachments) {
        if (!title) {
            title = ``;
        }
        if (!attachments.length) {
            attachments = [];
        }

        if (this.isOn) {
            this.web.chat.postMessage(
                this.channelID,
                title,
                { 
                    attachments
                }
            );
        }
    }
}