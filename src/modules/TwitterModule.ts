import { hasTrustedRole, isOpUser } from "../discord/permissions"
import events from "../events"
import IModule from "./IModule"
import discordBotClient from "../discord/discordBotClient"
import twitterBotClient from "../twitter/twitterBotClient"
import { Channel, Message, MessageReaction, PartialUser, TextChannel, User } from "discord.js"
import PendingRetweet from "../schema/PendingRetweet"

const approveEmoji = "👍"
const rejectEmoji = "👎"

export default class TwitterModule implements IModule {
    registerModule() {
        events.onDiscordReady(this.discordReadyHandler)
        events.onDiscordCommand(this.retweetCommandHandler)
        events.onDiscordReactionAdded(this.retweetApprovalReactionHandler)
    }

    tweetsChannel : TextChannel = null

    private async retweetCommandHandler(message:Message, name: string, args: string[]) {
        if (name == "rt") {
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

            try {
                tweetURL = new URL(args[0])
            } catch {
                var data = await twitterBotClient.get("statuses/user_timeline", { "screen_name": args[0] })
                tweetURL = new URL(`https://twitter.com/${args[0]}/status/${data.data[0].id_str}`);
            }

            var tweetID = tweetURL.pathname.substr(tweetURL.pathname.lastIndexOf("/") + 1)

            try {
                var tweet = await twitterBotClient.get(`statuses/show/${tweetID}`)
            } catch {
                message.channel.send("& Tweet not found. &")
            }

            var opUser = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)
            var dmChannel = await opUser.createDM();

            var approvalMessage : Message = await dmChannel.send(`& Retweet requested by ${message.member.user.username}#${message.member.user.discriminator} &\n${tweetURL}`)
            approvalMessage.react(approveEmoji)
            approvalMessage.react(rejectEmoji)
            //approvalMessage.pin()
            
            var pendingRetweet = new PendingRetweet({ approvalMessageID: approvalMessage.id, tweetID});
            pendingRetweet.save();
        }
    }

    private async discordReadyHandler() {
        this.tweetsChannel = await discordBotClient.channels.fetch(process.env.DISCORD_TWEETS_CHANNEL_ID) as TextChannel

        var pendingRetweets = await PendingRetweet.find({})
        var opUser = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)
        var dmChannel = await opUser.createDM();
        
        pendingRetweets.forEach(pendingRetweet => {
            dmChannel.messages.fetch(pendingRetweet.approvalMessageID)
        })
    }

    private async retweetApprovalReactionHandler(reaction: MessageReaction, user: User | PartialUser) {
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
            twitterBotClient.post('statuses/retweet/:id', {id: pendingRetweet.tweetID}, () => {
                console.log("done")
            });
            this.tweetsChannel.send("New Tweet! https://twitter.com/statuses/" + pendingRetweet.tweetID)
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
}