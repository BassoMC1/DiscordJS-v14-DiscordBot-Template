const { SlashCommandBuilder } = require("discord.js"); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Send pong back!"),
    async execute (Interaction) {
        Interaction.reply("pong!")
    }
}