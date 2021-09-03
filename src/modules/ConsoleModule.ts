import events from "../events"
import IModule from "./IModule"
import { Message } from "discord.js"
import { isOpUser } from "../discord/permissions"

export default class ConsoleModule implements IModule {
    registerModule() {
        events.onDiscordCommand(this.consoleCommand)
    }

    unregisterModule() {
        events.offDiscordCommand(this.consoleCommand)
    }

    getHelpText() {
        return null
    }

    consoleCommand = (message : Message, name : string, args : string[]) => {
        if (name == "&") {
            if (!isOpUser(message.author.id)) {
                message.channel.send("& You must be an operator to use this command. &")
                return;
            }
            let command = message.content.substring(3);
            try {
                let result = eval(command)
                message.reply(result)
            } catch (e) {
                message.reply(e.message)
            }
        }
    }
}