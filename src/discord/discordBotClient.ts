import { Client, Message } from "discord.js"
import events from "../events"
import fetch from "node-fetch"

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
            if(msg.content.startsWith("&")) {
                var split = msg.content.substr(1).split(/[ ,]+/)
                events.emitDiscordCommand(msg, split[0], split.length > 1 ? split.slice(1) : [])
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