const DiscordBot = require("./utils/discordbot")
require("dotenv").config()

const client = new DiscordBot({ 
    DiscordToken: process.env.DiscordBotToken, 
    mongodbUrl: "MissingUrl", 
    slashcommandGlobalStatus: false, 
    SlashTestguildid: "955508209412624445" ,
    PathToSlashCommandsFolder: "../slashcommands/",
    PathToEventsFolder: "../events/",
}).startBot()

module.exports = client