import events from "../events"
import IModule from "./IModule"
import * as packageInfo from "../../package.json"
import { isOpUser } from "../discord/permissions"
import discordBotClient from "../discord/discordBotClient"
import { modules } from ".."

export default class DebugModule implements IModule {
    registerModule() {
        events.onDiscordCommand(this.debugCommand)
    }

    unregisterModule() {
        events.offDiscordCommand(this.debugCommand)
    }

    debugCommand = (message, name) => {
        if (name == "debug") {
            const activeModules = modules.map(module => "\n • " + module.constructor.name)
            message.channel.send(`**${packageInfo.name} v${packageInfo.version}**\nActive Modules:${activeModules}`)
        }
    }

    getHelpText() {
        return null
    }
}