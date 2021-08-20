import * as dotenv from "dotenv"
dotenv.config();
import { connect } from "mongoose"

import IModule from "./modules/IModule";
import ModulesModule from "./modules/ModulesModule"
import TwitterModule from "./modules/TwitterModule"
import HelpModule from "./modules/HelpModule"
import GitHubModule from "./modules/GitHubModule"
import TwitchModule from "./modules/TwitchModule"
import EventsModule from "./modules/EventsModule";
import MinecraftModule from "./modules/MinecraftModule";
import MinecraftServerModule from "./modules/MinecraftServerModule";
import DiceModule from "./modules/DiceModule";
import CoinModule from "./modules/CoinModule";
import QuotesModule from "./modules/QuotesModule";
import FamiliarModule from "./modules/FamiliarModule";

import * as packageInfo from "../package.json"

console.log(`&&& ${packageInfo.name} v${packageInfo.version} &&&`)

connect(process.env.MONGO_DB_CONNECT_STRING, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => { console.log("& Mongoose connected. ")})

export const availableModules = {
    Twitter: new TwitterModule(),
    GitHub: new GitHubModule(),
    Twitch: new TwitchModule(),
    Events: new EventsModule(),
    Minecraft: new MinecraftModule(),
    MinecraftServer: new MinecraftServerModule(),
    Help: new HelpModule(),
    Modules: new ModulesModule(),
    Dice: new DiceModule(),
    Coin: new CoinModule(),
    Quotes: new QuotesModule(),
    Familiar: new FamiliarModule(),
}

export var modules : IModule[] = [];

process.env.MODULES.split(",").forEach(moduleName => {
    if (moduleName in availableModules)
        modules.push(availableModules[moduleName])
});

modules.forEach(module => {
    module.registerModule()
    console.log("& Registered " + module.constructor.name)
});

if (modules.length < 1)
  console.log("You haven't put any modules in you div")