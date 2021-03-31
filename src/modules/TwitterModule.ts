import { hasTrustedRole, isOpUser } from "../discord/permissions"
import events from "../events"
import IModule from "./IModule"
import discordBotClient from "../discord/discordBotClient"
import twitterBotClient from "../twitter/twitterBotClient"
import { Message, MessageReaction, PartialUser, TextChannel, User } from "discord.js"
import PendingRetweet from "../schema/PendingRetweet"

const approveEmoji = "👍"
const rejectEmoji = "👎"

export default class TwitterModule implements IModule {
    registerModule() {
        events.onDiscordReady(this.discordReadyHandler)
        events.onDiscordCommand(this.retweetCommandHandler)
        events.onDiscordCommand(this.tweetCommandHandler)
        events.onDiscordReactionAdded(this.retweetApprovalReactionHandler)

        this.listenToTweets()
    }

    tweetsChannel : TextChannel = null

    private async retweetCommandHandler(message: Message, name: string, args: string[]) {
        if (name == "rt" || name == "retweet") {
            var guild = await discordBotClient.guilds.fetch(process.env.DISCORD_GUILD_ID)
            var guildMember = await guild.members.fetch(message.author.id)

            if (!hasTrustedRole(guildMember) && !isOpUser(message.author.id)) {
                message.channel.send("& You must be trusted to use this command. &")
                return;
            }

            if (args.length != 1) {
                message.channel.send("& Invalid arguments. &")
                return;
            }

            var tweetURL : URL = null
            var findTweet = false;

            try {
                tweetURL = new URL(args[0])
            } catch {
                try {
                    findTweet = true;
                    var data = await twitterBotClient.get("statuses/user_timeline", { 
                        "screen_name": args[0],
                        "exclude_replies": true,
                        "include_rts": false
                    })
                    tweetURL = new URL(`https://twitter.com/${args[0]}/status/${data.data[0].id_str}`);
                } catch (error) {
                    message.channel.send("& Failed to find a tweet. &")
                    return;
                }
            }

            var tweetID = tweetURL.pathname.substr(tweetURL.pathname.lastIndexOf("/") + 1)

            try {
                var tweet = (await twitterBotClient.get(`statuses/show/${tweetID}`)).data
                if (tweet.retweeted) {
                    message.channel.send("& This tweet has already been retweeted. &")
                    return
                }
                var pendingRetweet = await PendingRetweet.findOne({ tweetID }).exec()
                if (pendingRetweet != null) {
                    message.channel.send("& This retweet already has a pending request. &")
                    return;
                }
            } catch {
                message.channel.send("& Tweet not found. &")
            }

            var opUser = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)
            var dmChannel = await opUser.createDM();

            var approvalMessage : Message = await dmChannel.send(`& Retweet requested by ${message.member.user.username}#${message.member.user.discriminator} &\n${tweetURL}`)
            approvalMessage.react(approveEmoji)
            approvalMessage.react(rejectEmoji)
            //approvalMessage.pin()
            
            var pendingRetweet = new PendingRetweet({ 
                approvalMessageID: approvalMessage.id, 
                tweetID, 
                discordUserID: message.author.id 
            });

            pendingRetweet.save();

            message.channel.send("& Retweet requested. &" + (findTweet ? `\n${args[0]}'s latest tweet: ${tweetURL}` : ""))
        }
    }

    private async tweetCommandHandler(message: Message, name: string, args: string[]) {
        if (name == "tweet") {
            if (!isOpUser(message.author.id)) {
                message.channel.send("& You must be an operator to use this command. &")
                return;
            }

            await twitterBotClient.post("statuses/update", { status: args.join(" ") })
        }
    }

    private discordReadyHandler = async () => {
        this.tweetsChannel = await discordBotClient.channels.fetch(process.env.DISCORD_TWEETS_CHANNEL_ID) as TextChannel

        var pendingRetweets = await PendingRetweet.find({})
        var opUser = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)
        var dmChannel = await opUser.createDM();
        
        pendingRetweets.forEach(pendingRetweet => {
            dmChannel.messages.fetch(pendingRetweet.approvalMessageID)
        })
    }

    private retweetApprovalReactionHandler = async (reaction: MessageReaction, user: User | PartialUser) => {
        // If the message isn't cached
        if (reaction.message.author == null)
            return
        // If it's not a reaction to an Alphabot message or Alphabot is reacting, ignore.
        if (reaction.message.author.id != discordBotClient.user.id || user.id == discordBotClient.user.id)
            return

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                return
            }
        }

        // If it's not a pending retweet message, move on.
        var pendingRetweet = await PendingRetweet.findOne({ approvalMessageID: reaction.message.id }).exec()
        if (pendingRetweet == null)
            return

        if (reaction.emoji.name == approveEmoji) {
            twitterBotClient.post('statuses/retweet/:id', { id: pendingRetweet.tweetID });
            var tweet = (await twitterBotClient.get("statuses/show/:id", { id: pendingRetweet.tweetID })).data
            this.tweetsChannel.send(`& Retweet from <@${pendingRetweet.discordUserID}> &\nhttps://twitter.com/${tweet.user.screen_name}/status/${pendingRetweet.tweetID}`)
                .then(message => {
                    discordBotClient.crosspost(message)
                        .then(res => res.json())
                        .then(json => {
                            if (json.code) {
                                console.error(`& Failed to publish retweet annoucement: ${json.code} &`)
                            }
                            else if (json.retry_after) {
                                console.error(`& Failed to publish retweet annoucement: rate limited. &`)
                            }
                        });
                })
                
            reaction.message.delete();
            pendingRetweet.delete()
        } else if (reaction.emoji.name == rejectEmoji) {
            reaction.message.delete();
            pendingRetweet.delete()
        }
    }

    private listenToTweets() {
        var stream = twitterBotClient.stream('statuses/filter', { follow: process.env.TWITTER_USER_ID })
        console.debug("& Twitter stream connected.")

        stream.on('tweet', this.annouceTweet)
    }

    private annouceTweet = async (tweet) => {
        // Exclude retweets and replies.
        if (('retweeted_status' in tweet && !tweet.is_quote_status) || tweet.in_reply_to_status_id != null)
            return;
        
        this.tweetsChannel.send(`& New tweet &\nhttps://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
        .then(message => {
            discordBotClient.crosspost(message)
                .then(res => res.json())
                .then(json => {
                    if (json.code) {
                        console.error(`& Failed to publish retweet annoucement: ${json.code} &`)
                    }
                    else if (json.retry_after) {
                        console.error(`& Failed to publish retweet annoucement: rate limited. &`)
                    }
                });
        })
    }

    getHelpText() {
        return "`&rt <tweet URL>`\nRequest @AmperTweets to retweet something.\nYou can also enter a twitter username, the latest tweet will be requested."
    }
}