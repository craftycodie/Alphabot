import * as dotenv from "dotenv";
dotenv.config();
import { connect } from "mongoose"

import DebugModule from "./modules/DebugModule"
import TwitterModule from "./modules/TwitterModule"
import HelpModule from "./modules/HelpModule";
import GitHubModule from "./modules/GitHubModule";

import * as packageInfo from "../package.json"


console.log(`&&& ${packageInfo.name} v${packageInfo.version} &&&`)

connect(process.env.MONGO_DB_CONNECT_STRING)
    .then(() => { console.log("& Mongoose connected. ")})

export const modules = [
    new DebugModule(),
    new TwitterModule(),
    new HelpModule(),
    new GitHubModule()
]

modules.forEach(module => {
    module.registerModule()
});
