import events from "../events"
import IModule from "./IModule"
import { Message, MessageEmbed } from "discord.js"
import Query from "minecraft-server-util"
import MineOnlineService from "../services/MineOnlineService"


export default class MinecraftModule implements IModule {
    registerModule() {
        events.onDiscordCommand(this.mcServerHandler)
    }

    mineOnlineService = new MineOnlineService()

    private mcServerHandler = async (message: Message, name: string, args: string[]) => {
        if (name == "mcserver" || name == "mc") {
            if (args.length != 1) {
                message.channel.send("& Invalid arguments. &")
                return;
            }

            var split = args[0].split(":")
            var host = split[0]
            var port = split.length > 1 ? parseInt(split[1]) : 25565

            try {
                var server = await this.mineOnlineService.getServer(host, port)

                var description = `${server.motd}\n\n${server.connectAddress}:${server.port}\n\n**Players** (${server.users}/${server.maxUsers})`

                server.players.forEach(player => {
                    description += "\n• " + player
                });

                const serverEmbed = new MessageEmbed()
                .setColor('#34aa2f')
                .setTitle(server.name)
                .setDescription(description)
                .setFooter("MineOnline", "https://mineonline.codie.gg/favicon.png")
                .setTimestamp()

                message.channel.send(serverEmbed)
            } catch {
                try {
                    var server = await Query.status(host, { port })

                    var description = `${host}:${server.port}\n\n**Players** (${server.onlinePlayers}/${server.maxPlayers})`

                    server.samplePlayers.forEach(player => {
                        description += "\n• " + player.name
                    });

                    const serverEmbed = new MessageEmbed()
                        .setColor('#34aa2f')
                        .setTitle(server.description.toString().replace(/\u00A7[0-9A-FK-OR]/ig,''))
                        .setDescription(description)
                        .addFields([
                            {
                                name: "Version",
                                value: server.version,
                                inline: true
                            }
                        ])
                        .setFooter("Minecraft", "https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/favicon-96x96.png")
                        .setTimestamp()

                    message.channel.send(serverEmbed)
                } catch {
                    message.channel.send("& Failed to query server. &")
                }
            }
        }
    }

    getHelpText() {
        return "`&mc <server address>`\nQuery a Minecraft server."
    }
}