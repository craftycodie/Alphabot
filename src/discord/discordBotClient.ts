import { Client } from "discord.js"
import events from "../events"

const Discord = require('discord.js')
const client : Client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })

client.on('ready', () => {
    console.log('& Discord client connected.');
    events.emitDiscordReady()
});
client.login(process.env.DISCORD_BOT_TOKEN)

client.on('messageReactionAdd', async (reaction, user) => {
    events.emitDiscordReactionAdded(reaction, user)
});

client.on('message', (msg) => {
    if(msg.content.startsWith("&")) {
        var split = msg.content.substr(1).split(/[ ,]+/)
        events.emitDiscordCommand(msg, split[0], split.length > 1 ? split.slice(1) : [])
    }
});

export default client