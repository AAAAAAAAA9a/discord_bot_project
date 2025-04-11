const { Events } = require('discord.js');
const ReactionUtils = require('../utils/reactionUtils');

module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        await ReactionUtils.processRoleReaction(reaction, user, false);
    }
};
