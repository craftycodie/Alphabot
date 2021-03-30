import { Message } from "discord.js";
import EventEmitter from "events"

enum Event {
    COMMAND
}

class Events {
    eventEmitter = new EventEmitter();

    emitCommand(message:Message, name: string, args: string[]) {
        this.eventEmitter.emit(Event[Event.COMMAND], message, name, args)
    }

    onCommand(commandHandler:(message: Message, name: string, args: string[]) => void) {
        this.eventEmitter.on(Event[Event.COMMAND], commandHandler)
    }

}

export default new Events();