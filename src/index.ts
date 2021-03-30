import * as dotenv from "dotenv";
dotenv.config();
import events from "./events"
import DebugModule from "./modules/DebugModule"
import client from "./discord/discordBotClient"
import TwitterModule from "./modules/TwitterModule"
import twitterBotClient from "./twitter/twitterBotClient"

const modules = [
    new DebugModule(),
    new TwitterModule()
]

modules.forEach(module => {
    module.registerCommands()
});

let tweetsChannel = null;

client.on('ready', () => {
    console.log('Bot is ready');
    client.channels.fetch('786479334939820033')
        .then(channel => tweetsChannel = channel)
});
client.login(process.env.DISCORD_BOT_TOKEN)

const approveEmoji = "👍"
const rejectEmoji = "👎"

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.message.author.id != client.user.id || user.id == client.user.id)
        return;

	// When we receive a reaction we check if the reaction is partial or not
	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}
	// Now the message has been cached and is fully available
	console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
	// The reaction is now also fully available and the properties will be reflected accurately:
	console.log(`${reaction.count} user(s) have given the same reaction to this message!`);

    if (reaction.emoji.name == approveEmoji) {
        var twitterUrl = new URL(reaction.message.content.substr(reaction.message.content.lastIndexOf("\n") + 1))
        var tweetId = twitterUrl.pathname.substr(twitterUrl.pathname.lastIndexOf("/") + 1)
        console.log(tweetId)
        twitterBotClient.post('statuses/retweet/:id', {id: tweetId}, () => {
            console.log("done")
        });
        tweetsChannel.send("New Tweet! " + twitterUrl.toString())
            .then(message => {
                fetch(
                    `https://discord.com/api/v8/channels/${message.channel.id}/messages/${message.id}/crosspost`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                        },
                    },
                )
                    .then(res => res.json())
                    .then(json => {
                        if (json.code) {
                            // Util.debugLog(channel, `${json.message} (Code: ${json.code})`);
                            console.debug(json.code)
                        }
                        else if (json.retry_after) {
                            // Double check in case of high flow spam (since it's an async function)
                            // if (Spam.rateLimitCheck(channel)) return;
                            // Spam.addSpamChannel(channel, json.retry_after);
                        }
                        else {
                            console.debug(`Published ${message.id} in ${message.channel.toString()} - ${message.guild.toString()}`);
                            return;
                        }
                    });
            })
        reaction.message.delete();
    } else if (reaction.emoji.name == rejectEmoji) {
        reaction.message.delete();
    }
});

client.on('message', (msg) => {
    if(msg.content.startsWith("&")) {
        var split = msg.content.substr(1).split(/[ ,]+/)
        events.emitCommand(msg, split[0], split.length > 1 ? split.slice(1) : []);
    }
});
