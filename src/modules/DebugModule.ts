import events from "../events"
import IModule from "./IModule"
import * as packageInfo from "../../package.json"
import { isOpUser } from "../discord/permissions"
import discordBotClient from "../discord/discordBotClient"
import { modules } from ".."

export default class DebugModule implements IModule {
    registerModule() {
        events.onDiscordCommand((message, name) => {
            if (name == "debug") {
                const activeModules = modules.map(module => "\n • " + module.constructor.name)
                message.channel.send(`**${packageInfo.name} v${packageInfo.version}**\nActive Modules:${activeModules}`)
            }
        })

        events.onDiscordCommand(async (message, name) => {
            if (name == "tidy" && isOpUser(message.author.id)) {
                var opUser = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)
                var dmChannel = await opUser.createDM();
                
                dmChannel.messages.fetch({
                    limit: 100 // Change `100` to however many messages you want to fetch
                }).then((messages) => { 
                    messages.filter(m => m.author.id === discordBotClient.user.id).forEach(async msg => {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        msg.delete()
                    })
                })
            }
        })
    }

    getHelpText() {
        return null
    }
}