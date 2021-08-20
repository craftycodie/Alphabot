import events from "../events"
import IModule from "./IModule"
import * as packageInfo from "../../package.json"
import { Message, MessageEmbed } from "discord.js"
import discordBotClient from "../discord/discordBotClient"
import { modules } from ".."
import os from "os"

export default class HelpModule implements IModule {
    registerModule() {
        events.onDiscordCommand(this.helpCommand)
    }

    unregisterModule() {
        events.offDiscordCommand(this.helpCommand)
    }

    helpCommand = async (message: Message, name) => {
        if (name == "help" || name == "?") {
            const helpText = modules.map(module => module.getHelpText()).join("\n\n")

            const helpEmbed = new MessageEmbed()
                .setColor('#DD2E44')
                .setTitle(`${packageInfo.name} v${packageInfo.version}`)
                .setURL('https://craftypat.ch/')
                .setAuthor(packageInfo.author)
                .setFooter("Running on " + os.hostname())
                .setDescription(`**${packageInfo.description}**\n\n${helpText}`)
                .setThumbnail(discordBotClient.user.avatarURL())
                .setTimestamp()

            
            const DMs = await message.author.createDM()
            DMs.send(helpEmbed)
            if (message.channel.type != "dm") {
                message.channel.send("& Help has been sent to your DMs :) &")
            }
        }
    }

    getHelpText() {
        return "`&help` \nShows this message."
    }
}