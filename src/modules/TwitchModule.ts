import { hasTrustedRole, isOpUser } from "../discord/permissions"
import events from "../events"
import IModule from "./IModule"
import discordBotClient from "../discord/discordBotClient"
import { Message, MessageEmbed, MessageReaction, PartialUser, TextChannel, User } from "discord.js"
import Streamer from "../schema/Streamer"
import TwitchTrackerService from "../services/TwitchTrackerService"

export default class TwitchModule implements IModule {
    registerModule() {
        events.onDiscordReady(this.discordReadyHandler)
        events.onDiscordCommand(this.addStreamerCommandHandler)
        events.onDiscordCommand(this.removeStreamerCommandHandler)
    }

    streamsChannel : TextChannel = null

    private discordReadyHandler = async () => {
        this.streamsChannel = await discordBotClient.channels.fetch(process.env.DISCORD_STREAMS_CHANNEL_ID) as TextChannel

        this.listenToStreams()
    }

    private addStreamerCommandHandler = async (message: Message, name: string, args: string[]) => {
        if (name == "addstream") {
            var guild = await discordBotClient.guilds.fetch(process.env.DISCORD_GUILD_ID)
            var guildMember = await guild.members.fetch(message.author.id)

            if (!hasTrustedRole(guildMember) && !isOpUser(message.author.id)) {
                message.channel.send("& You must be trusted to use this command. &")
                return;
            }

            var streamer = await Streamer.findOne({ twitchChannel: args[0] }).exec()

            if (streamer != null) {
                message.channel.send("& Stream annoucements are already enabled for this channel. &")
                return;
            }

            await new Streamer({ 
                twitchChannel: args[0],
                addedByDiscordUserID: message.author.id
            }).save()

            message.channel.send(`& Enabled Twitch stream notifications for **${args[0]}**. &`)

            if (this.twitchTracker != null) {
                var streamers = await Streamer.find()
                this.twitchTracker.setChannels(streamers.map(streamer => streamer.twitchChannel))
            }
        }
    }

    private removeStreamerCommandHandler = async (message: Message, name: string, args: string[]) => {
        if (name == "removestream") {
            var guild = await discordBotClient.guilds.fetch(process.env.DISCORD_GUILD_ID)
            var guildMember = await guild.members.fetch(message.author.id)

            if (!hasTrustedRole(guildMember) && !isOpUser(message.author.id)) {
                message.channel.send("& You must be trusted to use this command. &")
                return;
            }

            var streamer = await Streamer.findOne({ twitchChannel: args[0] }).exec()

            if (streamer == null) {
                message.channel.send("& Stream annoucements are not enabled for this channel. &")
                return;
            }

            await streamer.remove()

            message.channel.send(`& Disabled Twitch stream notifications for **${args[0]}**. &`)

            if (this.twitchTracker != null) {
                var streamers = await Streamer.find()
                this.twitchTracker.setChannels(streamers.map(streamer => streamer.twitchChannel))
            }
        }
    }

    twitchTracker: TwitchTrackerService = null

    private listenToStreams = async () => {
        var streamers = await Streamer.find()
        this.twitchTracker = new TwitchTrackerService(streamers.map(streamer => streamer.twitchChannel), this.annouceStream);
        this.twitchTracker.start()
    }

    private annouceStream = (stream) => {
        var embed = new MessageEmbed()
            .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${stream.user_login}.jpg`)
            .setAuthor(stream.user_login)
            .setTitle(stream.title)
            .setURL("https://www.twitch.tv/" + stream.user_login)
            .setTimestamp(new Date(stream.started_at))
            .setFooter("Twitch", "https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png")
            .setColor("#a970ff")

        if (stream.game != null && stream.game != "")
            embed.addField("Game", stream.game)

        this.streamsChannel.send(`& **${stream.user_login}** is live! &\nhttps://twitch.tv/${stream.user_login}`, embed)
            .then(message => {
                discordBotClient.crosspost(message)
                    .then(res => res.json())
                    .then(json => {
                        if (json.code) {
                            console.error(`& Failed to publish retweet annoucement: ${json.code} &`)
                        }
                        else if (json.retry_after) {
                            console.error(`& Failed to publish retweet annoucement: rate limited. &`)
                        }
                    });
            })
    }

    getHelpText() {
        return "`&addstream <channel>` \nEnable Twitch stream annoucements for a channel."
            + "\n`&removestream <channel>` \nDisable Twitch stream annoucements for a channel."
    }
}