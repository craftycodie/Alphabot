import events from "../events"
import IModule from "./IModule"
import * as packageInfo from "../../package.json"

export default class DebugModule implements IModule {
    registerCommands() {
        events.onCommand((message, name) => {
            if (name == "debug") {
                message.channel.send(`Alphabot v${packageInfo.version}`)
            }
        })
    }
}