import { Interaction, Message, MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import EventEmitter from "events"

enum Event {
    DISCORD_COMMAND,
    DISCORD_READY,
    DISCORD_REACTION_ADDED,
    DISCORD_INTERACTION,
}

class Events {
    eventEmitter = new EventEmitter();

    constructor() {
        this.eventEmitter.setMaxListeners(50)
    }

    emitDiscordCommand(message:Message, name: string, args: string[]) {
        this.eventEmitter.emit(Event[Event.DISCORD_COMMAND], message, name, args)
    }

    onDiscordCommand(commandHandler:(message: Message, name: string, args: string[]) => void) {
        this.eventEmitter.on(Event[Event.DISCORD_COMMAND], commandHandler)
    }

    offDiscordCommand(commandHandler:(message: Message, name: string, args: string[]) => void) {
        this.eventEmitter.off(Event[Event.DISCORD_COMMAND], commandHandler)
    }



    emitDiscordReady() {
        this.eventEmitter.emit(Event[Event.DISCORD_READY])
    }

    onDiscordReady(handler: () => void) {
        this.eventEmitter.on(Event[Event.DISCORD_READY], handler)
    }

    offDiscordReady(handler: () => void) {
        this.eventEmitter.off(Event[Event.DISCORD_READY], handler)
    }


    
    emitDiscordReactionAdded(reaction: MessageReaction | PartialMessageReaction, user:  User | PartialUser) {
        this.eventEmitter.emit(Event[Event.DISCORD_REACTION_ADDED], reaction, user)
    }

    onDiscordReactionAdded(reactionHandler: (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => void) {
        this.eventEmitter.on(Event[Event.DISCORD_REACTION_ADDED], reactionHandler)
    }

    offDiscordReactionAdded(reactionHandler: (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => void) {
        this.eventEmitter.off(Event[Event.DISCORD_REACTION_ADDED], reactionHandler)
    }



    emitDiscordInteraction(interaction: Interaction) {
        this.eventEmitter.emit(Event[Event.DISCORD_INTERACTION], interaction)
    }

    onDiscordInteraction(reactionHandler: (interaction: Interaction) => void) {
        this.eventEmitter.on(Event[Event.DISCORD_INTERACTION], reactionHandler)
    }

    offDiscordInteraction(reactionHandler: (interaction: Interaction) => void) {
        this.eventEmitter.off(Event[Event.DISCORD_INTERACTION], reactionHandler)
    }

}

export default new Events();