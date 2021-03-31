import events from "../events"
import IModule from "./IModule"
import * as packageInfo from "../../package.json"
import { MessageEmbed } from "discord.js"
import discordBotClient from "../discord/discordBotClient"
import { modules } from ".."

export default class HelpModule implements IModule {
    registerModule() {
        events.onDiscordCommand((message, name) => {
            if (name == "help" || name == "?") {
                const helpText = modules.map(module => module.getHelpText()).join("\n\n")

                const helpEmbed = new MessageEmbed()
                    .setColor('#DD2E44')
                    .setTitle(`${packageInfo.name} v${packageInfo.version}`)
                    .setURL('https://ampersand.social/')
                    .setAuthor(packageInfo.author)
                    .setDescription(`**${packageInfo.description}**\n\n${helpText}`)
                    .setThumbnail(discordBotClient.user.avatarURL())
                    .setTimestamp()

                message.channel.send(helpEmbed)
            }
        })
    }

    getHelpText() {
        return "`&help` \nShows this message."
    }
}