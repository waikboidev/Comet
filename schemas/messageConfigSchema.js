const { Schema, model } = require('mongoose');

const messageConfigSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    messages: {
        ban: { type: String, default: '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been banned for {reason}' },
        softban: { type: String, default: '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been soft-banned for {reason}' },
        unban: { type: String, default: '<:checkmark:1400320197851873371> @{userTag} has been unbanned for {reason}' },
        kick: { type: String, default: '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been kicked for {reason}' },
        mute: { type: String, default: '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been muted for {reason}' },
        unmute: { type: String, default: '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been unmuted for {reason}' },
        timeout: { type: String, default: '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been timed out for {reason}' },
        untimeout: { type: String, default: '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been untimed out for {reason}' },
        warn: { type: String, default: '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been warned for {reason}' },
        unwarn: { type: String, default: '<:checkmark:1400320197851873371> **Case {caseId}** @{userTag} has been unwarned' },
        dm: {
            title: { type: String, default: 'Comet Moderation' },
            description: { type: String, default: 'You were {action} from {server}.' }
        }
    }
});

module.exports = model('MessageConfig', messageConfigSchema);
