import events from "../events"
import IModule from "./IModule"
import * as packageInfo from "../../package.json"
import { DMChannel, Message, MessageEmbed, MessageReaction, PartialUser, User } from "discord.js"
import discordBotClient from "../discord/discordBotClient"
import os from "os"
import { isOpUser } from "../discord/permissions"
import Task from "../schema/Task"
import SavedMessage from "../schema/SavedMessage"
import sleep from "../utils/sleep"

export default class FamiliarModule implements IModule {
    private static readonly CURRENT_TASK_MESSAGE_NAME = "CURRENT_TASK_MESSAGE_NAME"
    private static readonly APPROVE_EMOJI = "👍"
    private static readonly REMINDER_FREQUENCY_SECONDS = 600
    private running = false

    private ownerDMs : DMChannel = null;

    registerModule() {
        events.onDiscordReady(this.updateStatus)
        events.onDiscordReady(this.reminderLoop)
        events.onDiscordReady(this.updateTaskMessage)
        events.onDiscordCommand(this.addTaskCommandHandler)
        events.onDiscordReactionAdded(this.taskCompletionReactionHandler)
        events.onDiscordCommand(this.helpCommand)

        events.onDiscordCommand(async (message, name, args) => {
            if (name == "❤" || name == "♥" || name == "<3" || name == "❤️" || (name == "i" && args.length >= 2 && args[0] == "love" && args[1].startsWith("you"))) {
                message.channel.send("❤️")
            }
        })
    }

    unregisterModule() {
        events.offDiscordReady(this.updateStatus)
        events.offDiscordReady(this.reminderLoop)
        events.offDiscordReady(this.updateTaskMessage)
        events.offDiscordCommand(this.addTaskCommandHandler)
        events.offDiscordReactionAdded(this.taskCompletionReactionHandler)
        events.offDiscordCommand(this.helpCommand)
    }

    updateStatus = async () => {
        var owner = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)

        discordBotClient.user.setPresence({
            activity: {
                name: owner.username,
                type: "LISTENING",
            }
        })
    }

    public reminderLoop = async () => {
        this.running = true
        
        while (this.running) {
            await sleep(FamiliarModule.REMINDER_FREQUENCY_SECONDS * 1000)
            try {
                await this.updateTaskMessage()
            } catch {
                // ignore
            }
        }
    }

    helpCommand = async (message, name, args) => {
        if (name == "who" && args.length == 2 && args[0] == "are" && args[1].startsWith("you")) {
            var owner = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)

            const helpEmbed = new MessageEmbed()
                .setColor('#DD2E44')
                .setTitle(`${packageInfo.name} v${packageInfo.version}`)
                .setURL('https://codie.gg/')
                .setAuthor(packageInfo.author)
                .setFooter("Occupying " + os.hostname())
                .setDescription(`${packageInfo.description}\n\nHi! My name is **${process.env.FAMILIAR_NAME}**, I'm here to help **${owner.username}**!`)
                .setThumbnail(discordBotClient.user.avatarURL())
                .setTimestamp()

            message.channel.send(helpEmbed)
        }
    }

    updateTaskMessage = async () => {
        if (this.ownerDMs == null)
            this.ownerDMs = await (await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)).createDM();

        await this.deleteSavedMessage()
        await this.createSavedMessage()
    }

    getCurrentTask = async () => {
        var tasks = await Task.find()
        tasks = tasks.sort((taskA, taskB) => taskA.createdAt - taskB.createdAt)
        return tasks[0]
    }

    deleteSavedMessage = async () => {
        var savedMessage = await SavedMessage.findOne({ name: FamiliarModule.CURRENT_TASK_MESSAGE_NAME }).exec()
        if (savedMessage != null) 
        {
            try {
                await (await this.ownerDMs.messages.fetch(savedMessage.messageID)).delete()
            } catch (error) {
                // ignore
            }
            await savedMessage.delete()
        }
    }

    createSavedMessage = async () => {
        var task = (await this.getCurrentTask())
        if (task != null) {
            var message = await this.ownerDMs.send(task.description)
            message.react(FamiliarModule.APPROVE_EMOJI)

            await new SavedMessage({
                name: FamiliarModule.CURRENT_TASK_MESSAGE_NAME,
                channelID: message.channel.id,
                messageID: message.id
            }).save()
        }
    }

    addTaskCommandHandler = async (message : Message, name : string, args : string[]) => {
        if (name == "i" && args.length >= 2 && args[0] == "need" && args[1] == "to") {

            var owner = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)

            if (!isOpUser(message.author.id)) {
                message.channel.send(`Sorry, I only respond to ${owner.username}.`)
                return;
            }

            if (args.length < 3) {
                message.channel.send("What do you need to do?")
                return;
            }

            var description = args.slice(2).join(" ")
            var createdAt = new Date().getTime()

            var isFirstTask = (await Task.find()).length == 0

            await new Task({
                description,
                createdAt
            }).save()

            if (isFirstTask)
                await this.updateTaskMessage()

            if (!(message.channel instanceof DMChannel))
                await message.delete()
        }
    }

    private taskCompletionReactionHandler = async (reaction: MessageReaction, user: User | PartialUser) => {
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

        // If it's not a task message
        var savedMessage = await SavedMessage.findOne({ messageID: reaction.message.id, name: FamiliarModule.CURRENT_TASK_MESSAGE_NAME }).exec()
        if (savedMessage == null)
            return

        if (reaction.emoji.name == FamiliarModule.APPROVE_EMOJI) {
            await (await this.getCurrentTask()).delete()
            await this.updateTaskMessage()
        }
    }

    getHelpText() {
        return null
    }
}