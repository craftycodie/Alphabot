import { Message, MessageReaction, PartialUser, User } from "discord.js";
import EventEmitter from "events"

enum Event {
    DISCORD_COMMAND,
    DISCORD_READY,
    DISCORD_REACTION_ADDED,
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



    emitDiscordReady() {
        this.eventEmitter.emit(Event[Event.DISCORD_READY])
    }

    onDiscordReady(handler: () => void) {
        this.eventEmitter.on(Event[Event.DISCORD_READY], handler)
    }


    
    emitDiscordReactionAdded(reaction: MessageReaction, user:  User | PartialUser) {
        this.eventEmitter.emit(Event[Event.DISCORD_REACTION_ADDED], reaction, user)
    }

    onDiscordReactionAdded(reactionHandler: (reaction: MessageReaction, user: User | PartialUser) => void) {
        this.eventEmitter.on(Event[Event.DISCORD_REACTION_ADDED], reactionHandler)
    }

}

export default new Events();