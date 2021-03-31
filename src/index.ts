import * as dotenv from "dotenv"
dotenv.config();
import { connect } from "mongoose"

import DebugModule from "./modules/DebugModule"
import TwitterModule from "./modules/TwitterModule"
import HelpModule from "./modules/HelpModule"
import GitHubModule from "./modules/GitHubModule"
import TwitchModule from "./modules/TwitchModule"

import * as packageInfo from "../package.json"



console.log(`&&& ${packageInfo.name} v${packageInfo.version} &&&`)

connect(process.env.MONGO_DB_CONNECT_STRING)
    .then(() => { console.log("& Mongoose connected. ")})

export const modules = [
    new TwitterModule(),
    new GitHubModule(),
    new TwitchModule(),
    new HelpModule(),

    new DebugModule(),
]

modules.forEach(module => {
    module.registerModule()
});
