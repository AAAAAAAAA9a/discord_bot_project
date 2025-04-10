const { Events } = require('discord.js');
const ReactionUtils = require('../utils/reactionUtils');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Process the reaction using the utility (true = adding a role)
        await ReactionUtils.processRoleReaction(reaction, user, true);
    }
};
