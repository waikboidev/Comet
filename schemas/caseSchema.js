const { Schema, model } = require('mongoose');

const caseSchema = new Schema({
    caseId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    moderatorTag: { type: String, required: true },
    targetId: { type: String, required: true },
    targetTag: { type: String, required: true },
    action: { type: String, required: true },
    reason: { type: String, default: 'No reason provided.' },
    duration: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
});

module.exports = model('case', caseSchema);
