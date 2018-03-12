const { WebClient } = require('@slack/client');

module.exports = class SlackService {
    constructor(isOn, token, channelID) {
        this.isOn = isOn;
        this.web = new WebClient(token);
        this.channelID = channelID; //#marketplace_status
    }

    sendMessage(text, attachments) {
        if (!text) {
            text = ``;
        }
        if (!attachments.length) {
            attachments = [];
        }

        if (this.isOn) {
            this.web.chat.postMessage({
                channel: this.channelID,
                response_type: 'in_channel',
                text,
                attachments
            });
        }
    }
}