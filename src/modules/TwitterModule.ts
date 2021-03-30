import { hasTrustedRole, isOpUser } from "../discord/permissions"
import events from "../events"
import IModule from "./IModule"
import discordBotClient from "../discord/discordBotClient"
import twitterBotClient from "../twitter/twitterBotClient"
import { Message } from "discord.js"

const approveEmoji = "👍"
const rejectEmoji = "👎"

export default class TwitterModule implements IModule {
    registerCommands() {
        events.onCommand(this.retweetHandler)
    }

    private async retweetHandler(message:Message, name: string, args: string[]): void {
        if (name == "rt") {
            if (!hasTrustedRole(message.member) && !isOpUser(message.author.id)) {
                message.channel.send("& You must be trusted to use this command. &")
                return;
            }

            if (args.length != 1) {
                message.channel.send("& Invalid arguments. &")
                return;
            }

            var tweetURL : URL = null

            try {
                tweetURL = new URL(args[0])
            } catch {
                var data = await twitterBotClient.get("statuses/user_timeline", { "screen_name": args[0] })
                tweetURL = new URL(`https://twitter.com/${args[0]}/status/${data.data[0].id_str}`);
            }

            discordBotClient.users.cache.get(process.env.DISCORD_OP_USER_ID).send(`Retweet requested by ${message.member.user.username}#${message.member.user.discriminator}\n${tweetURL}`)
            .then(message => {
                message.react(approveEmoji)
                message.react(rejectEmoji)
                // message.pin()
            });
        }
    }
}