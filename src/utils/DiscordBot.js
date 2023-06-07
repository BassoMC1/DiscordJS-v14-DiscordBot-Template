const Discord = require('discord.js');
const {GatewayIntentBits, Partials, InteractionType } = require('discord.js');
const fs = require("fs")
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require("dotenv").config()
const mongoose = require('mongoose');
const path = require("path");



class DiscordBot {
    constructor({ DiscordToken = undefined, mongodbUrl="MissingUrl", SlashTestguildid = undefined, slashcommandGlobalStatus = false, PathToSlashCommandsFolder = undefined, PathToEventsFolder = undefined}) {
      this.guildid = SlashTestguildid
      this.token = DiscordToken
      this.mongodbUrl = mongodbUrl
      this.slashcommandGlobalStatus = slashcommandGlobalStatus
      this.PathToSlashCommandsFolder = PathToSlashCommandsFolder
      this.PathToEventsFolder = PathToEventsFolder
      
      // Note: Remove the intents you dont need! And remove the partials you dont need!
      
      this.client = new Discord.Client({
        intents: [
          GatewayIntentBits.AutoModerationConfiguration,
          GatewayIntentBits.AutoModerationExecution,
          GatewayIntentBits.DirectMessageReactions,
          GatewayIntentBits.DirectMessageReactions,
          GatewayIntentBits.DirectMessageTyping,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.GuildEmojisAndStickers,
          GatewayIntentBits.GuildIntegrations,
          GatewayIntentBits.GuildInvites,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessageReactions,
          GatewayIntentBits.GuildMessageTyping,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildModeration,
          GatewayIntentBits.GuildPresences,
          GatewayIntentBits.GuildScheduledEvents,
          GatewayIntentBits.GuildVoiceStates,
          GatewayIntentBits.GuildWebhooks,
          GatewayIntentBits.Guilds,
          GatewayIntentBits.MessageContent
        ],
        partials: [
          Partials.Channel,
          Partials.GuildMember,
          Partials.Message,
          Partials.Reaction,
          Partials.User,
          Partials.GuildScheduledEvent,
          Partials.ThreadMember,
        ]
    })
    }
    
    async mongooseConnect() {
        if (this.mongodbUrl === 'MissingUrl') {
          console.log('[Warning] - Missing mongoose URL');
        } else {
          try {
            await mongoose.connect(this.mongodbUrl);
            console.log('[DB] - Connected to mongo!');
          } catch (error) {
            console.error('[DB] - Connection error:', error);
          }
        }
      }

      registerEvents() {
        const pathEvents = path.join(__dirname, this.PathToEventsFolder);
        fs.readdirSync(pathEvents).forEach((category) => {
          const commands = fs.readdirSync(`${pathEvents}${category}`).filter((file) => file.endsWith(".js"));
      
          commands.forEach((file) => {
            delete require.cache[require.resolve(`${pathEvents}${category}/${file}`)];
            const event = require(`${pathEvents}${category}/${file}`);
            if (event.once) {
              this.client.once(event.name, (...args) => event.execute( ...args));
            } else {
              this.client.on(event.name, (...args) => event.execute( ...args));
            }
          });
        });
      }

      registerSlashCommands() {
        const pathSlashcommands = path.join(__dirname, this.PathToSlashCommandsFolder);
        const commandFiles = fs.readdirSync(pathSlashcommands).filter(file => file.endsWith('.js'));

        const commands = []

        this.client.commands = new Discord.Collection();

        for (const file of commandFiles) {
            const command = require(pathSlashcommands + file);
            commands.push(command.data.toJSON());
            this.client.commands.set(command.data.name, command);
        }

        this.client.once("ready", () => {
    
            const rest = new REST({
                version: "10"
            }).setToken(this.token);
        
            (async () => {
                try {
                    if (this.slashcommandGlobalStatus) {
                        await rest.put(Routes.applicationCommands(this.client.user.id), {
                            body: commands
                        });
                        console.log("[Slash] - Successfully registered slash commands globally");
                    } else {
                        await rest.put(Routes.applicationGuildCommands(this.client.user.id, this.guildid), {
                            body: commands
                        });
                        console.log("[Slash] - Successfully registered slash commands locally");
                    }
                } catch (err) {
                   if (err) console.error(err);
                }
            })();
        });
    }

    async slachcommands() {
      this.client.on("interactionCreate", async interaction => {
        if (interaction.type === InteractionType.ApplicationCommand) {
          const command = this.client.commands.get(interaction.commandName);
          if(!command) return;
          try{
              await command.execute(interaction);
          } catch(err) {
              if (err) console.log(err);
      
              await interaction.reply({
                  content: "An error occurred while trying to executing the command",
                  ephemeral: true
              });
          }
        }
      })
    };
    
    startBot() {
        this.mongooseConnect()
        this.registerEvents()
        this.registerSlashCommands()
        this.slachcommands()
        this.client.login(this.token)
        return this.client
    }
}

module.exports = DiscordBot