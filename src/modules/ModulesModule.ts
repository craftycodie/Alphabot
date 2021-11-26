import events from "../events"
import IModule from "./IModule"
import * as packageInfo from "../../package.json"
import { isOpUser } from "../discord/permissions"
import { availableModules, modules } from ".."

export default class ModulesModule implements IModule {
    registerModule() {
        events.onDiscordCommand(this.modulesCommand)
        events.onDiscordCommand(this.moduleCommand)
    }

    unregisterModule() {
        events.offDiscordCommand(this.modulesCommand)
        events.offDiscordCommand(this.moduleCommand)
    }

    modulesCommand = (message, name) => {
        if (name == "modules") {
            var activeModules = ""
            Object.values(availableModules).forEach(module => {
                if (module.constructor.name === "UpdaterModule") return
                activeModules += `\n${modules.includes(module) ? '✅' : '❌'} ${module.constructor.name}`
            })
            message.channel.send(`**${packageInfo.name} v${packageInfo.version}**\nModules:${activeModules}`)
        }
    }

    moduleCommand = (message, name, args) => {
        if (name == "module") {
            if (!isOpUser(message.author.id)) {
                message.channel.send("& Only codie can do this. &")
                return;
            }

            if (args.length != 2 || (args[0] != "add" && args[0] != "remove")) {
                message.channel.send("& Invalid arguments. &")
                return;
            }

            const moduleName = args[1]

            if (!(moduleName in availableModules)) {
                message.channel.send("& Unrecognized module. &")
                return;
            }

            switch(args[0]) {
                case "add": {
                    if (modules.includes(availableModules[moduleName])) {
                        message.channel.send("& This module is already registered. &")
                        return;
                    }
                    availableModules[moduleName].registerModule()
                    modules.push(availableModules[moduleName])
                    message.channel.send(`& Registered ${moduleName} Module. &`)
                    break;
                }
                case "remove": {
                    if (!modules.includes(availableModules[moduleName])) {
                        message.channel.send("& This module is not registered. &")
                        return;
                    }
                    availableModules[moduleName].unregisterModule()
                    modules.splice(modules.indexOf(availableModules[moduleName]), 1)
                    message.channel.send(`& Unregistered ${moduleName} Module. &`)
                    break;
                }
            }
        }
    }

    getHelpText() {
        return null
    }
}