import events from "../events"
import IModule from "./IModule"
import { Message, MessageEmbed, MessageReaction, PartialUser, TextChannel, User } from "discord.js"
import discordBotClient from "../discord/discordBotClient"
import WhitelistRequest from "../schema/WhitelistRequest"
import { Rcon } from "rcon-client"
import Query from "minecraft-server-util"
import SavedMessage from "../schema/SavedMessage"

const approveEmoji = "👍"
const rejectEmoji = "👎"

export default class MinecraftServerModule implements IModule {
    private static readonly LIST_MESSAGE_NAME = "MINECRAFT_SERVER_LIST"

    private serverListChannel : TextChannel = null
    private playersOnline : string[] = []


    registerModule() {
        events.onDiscordCommand(this.mcServerHandler)
        events.onDiscordReady(this.discordReadyHandler)
        events.onDiscordCommand(this.whitelistHandler)
        events.onDiscordReactionAdded(this.whitelistApprovalReactionHandler)

        this.startServerList()
    }

    unregisterModule() {
        events.offDiscordCommand(this.mcServerHandler)
        events.offDiscordReady(this.discordReadyHandler)
        events.offDiscordCommand(this.whitelistHandler)
        events.offDiscordReactionAdded(this.whitelistApprovalReactionHandler)

        this.stopServerList()
    }

    private timeout: NodeJS.Timeout = null;

    private startServerList = () => {
        this.doServerList()
    }

    private stopServerList = () => {
        clearTimeout(this.timeout);
        this.timeout = null;
    }

    private doServerList = async () => {
        try {
            const rcon = await Rcon.connect({
                host: process.env.MINECRAFT_RCON_IP, port: parseInt(process.env.MINECRAFT_RCON_PORT), password: process.env.MINECRAFT_RCON_PASSWORD
            })
            var list = await rcon.send("list");
            this.playersOnline = [];
            list = list.substr(list.indexOf(":") + 2);
            if (list.length > 0)
                this.playersOnline = list.split(", ");

            (await this.getSavedMessage()).edit(await this.getServerListMessage())
        } catch (error) {
            
        }
        this.timeout = setTimeout(this.doServerList, 30000);
    }


    getServerListMessage = async () => {
        try {
            var server = await Query.status(process.env.MINECRAFT_IP, { port: parseInt(process.env.MINECRAFT_PORT) })

            var description = `**IP:** ${process.env.MINECRAFT_IP}` + (server.port != 25565 ? `:${server.port}` : '') + `\n\n**Players** (${server.onlinePlayers}/${server.maxPlayers})`

            var guild = await discordBotClient.guilds.fetch(process.env.DISCORD_GUILD_ID)

            this.playersOnline.forEach(player => {
                description += "\n• " + player
            });

            if (this.playersOnline.length < 1)
                description += "\nNo one is playing :("

            const serverEmbed = new MessageEmbed()
                .setColor('#34aa2f')
                .setThumbnail(guild.iconURL())
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

            return serverEmbed
        } catch {
            return `The server appears to be offline T_T`
        }
    }

    getSavedMessage = async (): Promise<Message> => {
        this.serverListChannel = await discordBotClient.channels.fetch(process.env.DISCORD_MINECRAFT_SERVER_LIST_CHANNEL_ID) as TextChannel

        var savedMessage = await SavedMessage.findOne({ name: MinecraftServerModule.LIST_MESSAGE_NAME }).exec()
        if (savedMessage == null) {
            var message = await this.serverListChannel.send(await this.getServerListMessage())
            await this.serverListChannel.send("stinky!")

            await new SavedMessage({
                name: MinecraftServerModule.LIST_MESSAGE_NAME,
                guildID: message.guild.id,
                channelID: message.channel.id,
                messageID: message.id
            }).save()

            return message
        } else {
            try {
                return await this.serverListChannel.messages.fetch(savedMessage.messageID)
            } catch (error) {
                savedMessage.delete()

                var message = await this.serverListChannel.send(await this.getServerListMessage())
                await this.serverListChannel.send("smelly!")

                await new SavedMessage({
                    name: MinecraftServerModule.LIST_MESSAGE_NAME,
                    guildID: message.guild.id,
                    channelID: message.channel.id,
                    messageID: message.id
                }).save()
    
                return message
            }
        }
    }
    
    private mcServerHandler = async (message: Message, name: string, args: string[]) => {
        if (name == "mc") {
            var description = `**IP** ${process.env.MINECRAFT_IP}${process.env.MINECRAFT_PORT != "25565" ? ":" + server.port : ""}\n\n`

            var guild = await discordBotClient.guilds.fetch(process.env.DISCORD_GUILD_ID)


            const serverEmbed = new MessageEmbed()
                .setColor('#DD2E44')
                .setThumbnail(guild.iconURL())
                .setFooter("Minecraft", "https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/favicon-96x96.png")
                .setTimestamp()

            try {
                var server = await Query.status(process.env.MINECRAFT_IP, { port: parseInt(process.env.MINECRAFT_PORT) })

                serverEmbed.setTitle(server.description.toString().replace(/\u00A7[0-9A-FK-OR]/ig,''))
                    .addFields([
                        {
                            name: "Version",
                            value: server.version,
                            inline: true
                        }
                    ])

                // description += `**Players** (${server.onlinePlayers}/${server.maxPlayers})`

                // if (server.samplePlayers) {
                //     server.samplePlayers.forEach(player => {
                //         description += "\n• " + player.name
                //     })
                // }
            } catch {
                description += `The server appears to be offline T_T`
            }

            serverEmbed.setDescription(description)

            message.channel.send(serverEmbed)
        }
    }

    private discordReadyHandler = async () => {
        var whitelistRequests = await WhitelistRequest.find({})
        var opUser = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)
        var dmChannel = await opUser.createDM();
        
        whitelistRequests.forEach(whitelistRequest => {
            dmChannel.messages.fetch(whitelistRequest.approvalMessageID)
        })
    }

    private whitelistHandler = async (message: Message, name: string, args: string[]) => {
        if (name == "whitelist") {
            if (args.length != 1) {
                message.channel.send("& Please provide a minecraft username. &")
                return;
            }

            const minecraftUsername = args[0]

            var whitelistRequest = await WhitelistRequest.findOne({ minecraftUsername }).exec()
            if (whitelistRequest != null) {
                if (whitelistRequest.approved)
                    message.channel.send("& You are already on the whitelist :) &")
                else
                    message.channel.send("& You already have a pending whitelist request. &")
                return;
            }

            var opUser = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)
            var dmChannel = await opUser.createDM();

            var approvalMessage : Message = await dmChannel.send(`& Whitelist requested by ${message.member.user.username}#${message.member.user.discriminator} &\n${minecraftUsername}`)
            approvalMessage.react(approveEmoji)
            approvalMessage.react(rejectEmoji)
            //approvalMessage.pin()
            
            var whitelistRequest = new WhitelistRequest({ 
                approvalMessageID: approvalMessage.id, 
                minecraftUsername, 
                discordUserID: message.author.id 
            });

            whitelistRequest.save();

            message.channel.send("& Whitelist requested. &")
        }
    }

    private whitelistApprovalReactionHandler = async (reaction: MessageReaction, user: User | PartialUser) => {
        // If the message isn't cached
        if (reaction.message.author == null)
            return
        // If it's not a reaction to an Alphabot message or Alphabot is reacting, ignore.
        if (reaction.message.author.id != discordBotClient.user.id || user.id == discordBotClient.user.id)
            return

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                return
            }
        }

        // If it's not a pending retweet message, move on.
        var whitelistRequest = await WhitelistRequest.findOne({ approvalMessageID: reaction.message.id }).exec()
        if (whitelistRequest == null)
            return

        if (reaction.emoji.name == approveEmoji) {
            try {
                const rcon = await Rcon.connect({
                    host: process.env.MINECRAFT_RCON_IP, port: parseInt(process.env.MINECRAFT_RCON_PORT), password: process.env.MINECRAFT_RCON_PASSWORD
                })
                await rcon.send("whitelist add " + whitelistRequest.minecraftUsername)
                rcon.end()
                whitelistRequest.approved = true
                whitelistRequest.save()
                reaction.message.delete();
                var requestUser = await discordBotClient.users.fetch(whitelistRequest.discordUserID)
                var dmChannel = await requestUser.createDM();
                await dmChannel.send(`& Your whitelist request for ${whitelistRequest.minecraftUsername} has been approved!`)
            } catch {
                reaction.remove()
            }
        } else if (reaction.emoji.name == rejectEmoji) {
            var requestUser = await discordBotClient.users.fetch(whitelistRequest.discordUserID)
            var dmChannel = await requestUser.createDM();
            await dmChannel.send(`& Your whitelist request for ${whitelistRequest.minecraftUsername} has been declined :(`)

            reaction.message.delete();
            whitelistRequest.delete()
        }
    }

    getHelpText() {
        return "`&whitelist <minecraft username>`\nRequest to be whitelisted on the Minecraft server."
    }
}