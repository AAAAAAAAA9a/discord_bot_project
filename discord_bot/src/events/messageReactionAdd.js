const { Events } = require('discord.js');
const ReactionUtils = require('../utils/reactionUtils');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        await ReactionUtils.processRoleReaction(reaction, user, true);
    }
};
