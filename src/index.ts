import * as dotenv from "dotenv";
dotenv.config();
import events from "./events"
import DebugModule from "./modules/DebugModule"
import client from "./discord/discordBotClient"
import TwitterModule from "./modules/TwitterModule"
import twitterBotClient from "./twitter/twitterBotClient"
import { connect } from "mongoose"

connect(process.env.MONGO_DB_CONNECT_STRING)

const modules = [
    new DebugModule(),
    new TwitterModule()
]

modules.forEach(module => {
    module.registerModule()
});
