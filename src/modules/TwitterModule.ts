import { hasTrustedRole, isOpUser } from "../discord/permissions"
import events from "../events"
import IModule from "./IModule"
import discordBotClient from "../discord/discordBotClient"
import twitterBotClient from "../twitter/twitterBotClient"

const approveEmoji = "👍"
const rejectEmoji = "👎"

export default class TwitterModule implements IModule {
    registerCommands() {
        events.onCommand(async (message, name, args) => {
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
                    var data = await twitterBotClient.get("statuses/user_timeline", {"screen_name": message.content.substring(4)})
                    tweetURL = new URL(`https://twitter.com/${message.content.substring(4)}/status/${data.data[0].id_str}`);
                }

                var tweetID = tweetURL.pathname.substr(tweetURL.pathname.lastIndexOf("/") + 1)

                discordBotClient.users.cache.get(process.env.DISCORD_OP_USER_ID).send(`Retweet requested by ${message.member.user.username}#${message.member.user.discriminator}\n${tweetURL}`)
                .then(message => {
                    message.react(approveEmoji)
                    message.react(rejectEmoji)
                    // message.pin()
                });
            }
        })
    }
}