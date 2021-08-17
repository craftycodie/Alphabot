import * as dotenv from "dotenv"
dotenv.config();
import { connect } from "mongoose"

import IModule from "./modules/IModule";
import DebugModule from "./modules/DebugModule"
import TwitterModule from "./modules/TwitterModule"
import HelpModule from "./modules/HelpModule"
import GitHubModule from "./modules/GitHubModule"
import TwitchModule from "./modules/TwitchModule"
import EventsModule from "./modules/EventsModule";
import MinecraftModule from "./modules/MinecraftModule";
import MinecraftServerModule from "./modules/MinecraftServerModule";
import DiceModule from "./modules/DiceModule";

import * as packageInfo from "../package.json"

console.log(`&&& ${packageInfo.name} v${packageInfo.version} &&&`)

connect(process.env.MONGO_DB_CONNECT_STRING, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => { console.log("& Mongoose connected. ")})

const availableModules = {
    Twitter: new TwitterModule(),
    GitHub: new GitHubModule(),
    Twitch: new TwitchModule(),
    Events: new EventsModule(),
    Minecraft: new MinecraftModule(),
    MinecraftServer: new MinecraftServerModule(),
    Help: new HelpModule(),
    Debug: new DebugModule(),
    Dice: new DiceModule(),
}

export var modules : IModule[] = [];

process.env.MODULES.split(",").forEach(moduleName => {
    if (moduleName in availableModules)
        modules.push(availableModules[moduleName])
});

modules.forEach(module => {
    module.registerModule()
});
