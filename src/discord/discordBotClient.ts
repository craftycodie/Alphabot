import { Client, Message } from "discord.js"
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
        
        this.on('message', (msg) => {
            if (msg.author.id == this.user.id)
                return
                
            if (msg.content.startsWith(commandPrefix)) {
                var split = msg.content.substr(commandPrefix.length).split(/[ ,]+/)
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
                events.emitDiscordCommand(msg, commandName, args)
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

export default new DiscordBotClient({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })