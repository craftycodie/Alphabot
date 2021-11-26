import { Client, DMChannel, Intents, Message } from "discord.js"
import events from "../events"
import fetch from "node-fetch"

const commandPrefix = process.env.COMMAND_PREFIX || "&"

class DiscordBotClient extends Client {
    constructor(options) {
        super(options)

        this.on('ready', () => {
            console.log('& Discord client connected.');
            events.emitDiscordReady()
        });
        this.login(process.env.DISCORD_BOT_TOKEN)
        
        this.on('messageReactionAdd', async (reaction, user) => {
            events.emitDiscordReactionAdded(reaction, user)
        });

        this.on('interactionCreate', async (interaction) => {
            events.emitDiscordInteraction(interaction)
        })
        
        this.on('message', (msg) => {
            if (msg.author.id == this.user.id)
                return

            var parsedPrefix = commandPrefix

            // hacky fix for mention prefixes on mobile.
            if (commandPrefix[2] === "!" && msg.content[1] === "@" && msg.content[2] != "!") {
              parsedPrefix = commandPrefix.replace("!", "")
            }
                
            if (msg.content.startsWith(parsedPrefix) || msg.channel instanceof DMChannel) {
                var split = msg.content.substr(msg.content.startsWith(parsedPrefix) ? parsedPrefix.length : 0).split(/[ ,]+/)
                var commandName = split[0]
                var args : string[] = []
                // Crappy arguments parsing.
                if (split.length > 1) {
                    split = split.slice(1)
                    var curr = null
                    split.forEach(bit => {
                        if (curr == null && bit[0] != "\"") {
                            args.push(bit)
                        } else {
                            if (curr == null && bit[0] == "\"") {
                                curr = bit.substr(1)
                            } else if (curr != null && bit[bit.length -1] == "\"") {
                                curr += " " + bit.substr(0, bit.length -1)
                                args.push(curr)
                                curr = null
                            } else if (curr != null) {
                                curr += " " + bit
                            }
                        }
                    })
                }
                events.emitDiscordCommand(msg, commandName.toLowerCase(), args)
            }
        });
    }

    crosspost(message: Message) {
        return fetch(
            `https://discord.com/api/v8/channels/${message.channel.id}/messages/${message.id}/crosspost`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                },
            },
        )
    }
}

export default new DiscordBotClient({ 
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'] ,
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
})
