const { Events } = require('discord.js');
const ReactionUtils = require('../utils/reactionUtils');

module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        // Process the reaction using the utility (false = removing a role)
        await ReactionUtils.processRoleReaction(reaction, user, false);
    }
};
