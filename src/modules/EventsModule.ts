import events from "../events"
import IModule from "./IModule"
import { Message, TextChannel } from "discord.js"
import discordBotClient from "../discord/discordBotClient"
import SavedMessage from "../schema/SavedMessage"
import moment from "moment-timezone"
import Event from "../schema/Event"
import { hasTrustedRole, isOpUser } from "../discord/permissions"

export default class EventsModule implements IModule {
    private static readonly EVENTS_MESSAGE_NAME = "UPCOMING_EVENTS_MESSAGE"

    eventBoardChannel : TextChannel = null

    registerModule() {
        events.onDiscordReady(this.updateEventBoard)
        events.onDiscordCommand(this.addEventCommandHandler)
        events.onDiscordCommand(this.removeEventCommandHandler)
    }

    unregisterModule() {
        events.offDiscordReady(this.updateEventBoard)
        events.offDiscordCommand(this.addEventCommandHandler)
        events.offDiscordCommand(this.removeEventCommandHandler)
    }

    addEventCommandHandler = async (message : Message, name : string, args : string[]) => {
        if (name == "addevent") {
            var guild = await discordBotClient.guilds.fetch(process.env.DISCORD_GUILD_ID)
            var guildMember = await guild.members.fetch(message.author.id)

            if (!hasTrustedRole(guildMember) && !isOpUser(message.author.id)) {
                message.channel.send("& You must be trusted to use this command. &")
                return;
            }

            if (args.length < 1 || args.length > 3) {
                message.channel.send("& Invalid arguments. &")
                return;
            }

            var timestamp = null
            var description = null

            if (args.length > 1) {
                timestamp = parseInt(args[1])
                if (isNaN(timestamp) && args.length == 3) {
                    message.channel.send("& Invalid arguments. &")
                    return; 
                } else if (isNaN(timestamp) && args.length == 2) {
                    timestamp = null
                    description = args[1]
                } else if (args.length == 3) {
                    description = args[2]
                }
            }

            var event = await Event.findOne({ name: args[0] }).exec()
            if (event != null) {
                event.delete()
            }

            await new Event({
                name: args[0],
                description,
                timestamp
            }).save()

            await this.updateEventBoard()
        }
    }

    removeEventCommandHandler = async (message : Message, name : string, args : string[]) => {
        if (name == "removeevent") {
            var guild = await discordBotClient.guilds.fetch(process.env.DISCORD_GUILD_ID)
            var guildMember = await guild.members.fetch(message.author.id)

            if (!hasTrustedRole(guildMember) && !isOpUser(message.author.id)) {
                message.channel.send("& You must be trusted to use this command. &")
                return;
            }

            if (args.length != 1) {
                message.channel.send("& Invalid arguments. &")
                return;
            }

            var event = await Event.findOne({ name: args[0] }).exec()
            if (event != null) {
                event.delete()
            }

            await this.updateEventBoard()
        }
    }

    updateEventBoard = async () => {
        (await this.getSavedMessage()).edit(await this.getEventBoardText())
    }

    getSavedMessage = async (): Promise<Message> => {
        this.eventBoardChannel = await discordBotClient.channels.fetch(process.env.DISCORD_EVENTS_BOARD_CHANNEL_ID) as TextChannel

        var savedMessage = await SavedMessage.findOne({ name: EventsModule.EVENTS_MESSAGE_NAME}).exec()
        if (savedMessage == null) {
            var message = await this.eventBoardChannel.send(await this.getEventBoardText())

            await new SavedMessage({
                name: EventsModule.EVENTS_MESSAGE_NAME,
                guildID: message.guild.id,
                channelID: message.channel.id,
                messageID: message.id
            }).save()

            return message
        } else {
            try {
                return await this.eventBoardChannel.messages.fetch(savedMessage.messageID)
            } catch (error) {
                savedMessage.delete()

                var message = await this.eventBoardChannel.send(await this.getEventBoardText())

                await new SavedMessage({
                    name: EventsModule.EVENTS_MESSAGE_NAME,
                    guildID: message.guild.id,
                    channelID: message.channel.id,
                    messageID: message.id
                }).save()
    
                return message
            }
        }
    }

    getEventBoardText = async (): Promise<string> => {
        var events = await Event.find()

        events = events.sort((a, b) => (a.timestamp ? a.timestamp : 0) - (b.timestamp ? b.timestamp : 0))

        var description = "**& Upcoming Events &**"

        events = events.filter(event => event.timestamp == null || event.timestamp > new Date().getSeconds())

        events.forEach(event => {
            description += `\n\n**${event.name}**`

            if (event.description != null) {
                description += '\n' + event.description
            }

            if (event.timestamp == null)
                description += "\n*Date TBD*"
            else {
                description +=  "\n:flag_gb:   " + (moment(event.timestamp).year() != new Date().getFullYear() ? moment.unix(event.timestamp).tz('Europe/London').format('Do MMMM YYYY h:mma (zz)') : moment.unix(event.timestamp).tz('Europe/London').format('Do MMMM h:mma (zz)'))
                description +=  "\n:flag_us:   " + (moment(event.timestamp).year() != new Date().getFullYear() ? moment.unix(event.timestamp).tz('America/New_York').format('Do MMMM YYYY h:mma (zz)') : moment.unix(event.timestamp).tz('America/New_York').format('Do MMMM h:mma (zz)'))
            }
        });

        if (events.length == 0)
            description += "\n\nNo upcoming events."
    
        return description
    }

    getHelpText() {
        return "`&addevent <name> [unix timestamp] [description]`\nAdd an upcoming event to the board."
            + "\n`&removeevent <name>`\nRemove an event from the board."
    }
}