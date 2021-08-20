import events from "../events"
import IModule from "./IModule"
import { Channel, DMChannel, Message, MessageEmbed, MessageReaction, PartialUser, TextChannel, User } from "discord.js"
import discordBotClient from "../discord/discordBotClient"
import Quote, { QuoteDocument } from "../schema/Quote"
import { Util } from "discord.js"

export default class QuotesModule implements IModule {
    registerModule() {
        events.onDiscordCommand(this.quoteAddCommand)
        events.onDiscordCommand(this.quoteCommand)
    }

    unregisterModule() {
        events.offDiscordCommand(this.quoteAddCommand)
        events.offDiscordCommand(this.quoteCommand)
    }

    async getRandomQuote() {
        const count = await Quote.count();
        var rand = Math.floor(Math.random() * count);
        return await Quote.findOne().skip(rand).exec()
    };

    private quoteAddCommand = async (message: Message, name: string, args: string[]) => {
        if (name == "addquote" || name == "aq") {
            if (message.reference) {
                const originalMessage = await message.channel.messages.fetch(message.reference.messageID)
                const text = Util.cleanContent(originalMessage.content, originalMessage)

                if (text.length > 2000) {
                    message.channel.send("& This quote is too long. &")
                    return;
                }

                var existingQuote = await Quote.findOne({ text }).exec()
                if (existingQuote != null) {
                    message.channel.send("& This quote already exists. &")
                    return;
                }

                const quote = new Quote({
                    text,
                    addedBy: message.author.id,
                    quoteFrom: originalMessage.author.id
                })

                await quote.save()
                message.channel.send("Added Quote")
                await this.sendQuote(quote, message.channel as TextChannel | DMChannel)
            } else {
                if (message.content.length < name.length + 2) {
                    message.channel.send("& Please provide a quote. &")
                    return;
                }

                var text = Util.cleanContent(message.content, message)
                text = text.substring(name.length + 2)

                if (text.length < 1) {
                    message.channel.send("& Please provide a quote. &")
                    return;
                }

                if (text.length > 2000) {
                    message.channel.send("& This quote is too long. &")
                    return;
                }

                var existingQuote = await Quote.findOne({ text }).exec()
                if (existingQuote != null) {
                    message.channel.send("& This quote already exists. &")
                    return;
                }

                const quote = new Quote({
                    text,
                    addedBy: message.author.id,
                })

                await quote.save()
                message.channel.send("Added Quote")
                await this.sendQuote(quote, message.channel as TextChannel | DMChannel)
            }
        }
    }

    private quoteCommand = async (message: Message, name: string, args: string[]) => {
        if (name == "q" || name == "quote") {
            const quote = await this.getRandomQuote()
            await this.sendQuote(quote, message.channel as TextChannel | DMChannel)
        }
    }

    private sendQuote = async (quote: QuoteDocument, channel: TextChannel | DMChannel) => {
        if (quote == null) {
            channel.send("& Couldn't find any quotes, try adding one! &")
            return;
        }

        var quoteFromUser = null
        if (quote.quoteFrom != null) {
            quoteFromUser = await discordBotClient.users.fetch(quote.quoteFrom)
        }
        const addedByUser = await discordBotClient.users.fetch(quote.addedBy)

        const quoteEmbed = new MessageEmbed()
            .setColor('#DD2E44')
            .setFooter(`Added by ${addedByUser.username} on ${quote.createdAt.toDateString()}.`)

        // Links dont render in embeds.
        if (quote.text.includes("http://") || quote.text.includes("https://")) {
            channel.send(`${quoteFromUser != null ? '"' : ''}${quote.text}${quoteFromUser != null ? '"' : ''}`)
            channel.send(quoteEmbed)
            return
        }

        if (quote.text.length > 256) {
            quoteEmbed.setDescription(`***${quoteFromUser != null ? '"' : ''}${quote.text}${quoteFromUser != null ? '"' : ''}***`)
        } else {
            quoteEmbed.setTitle(`*${quoteFromUser != null ? '"' : ''}${quote.text}${quoteFromUser != null ? '"' : ''}*`)
        }

        if (quoteFromUser) {
            quoteEmbed.setAuthor(quoteFromUser.username, quoteFromUser.avatarURL())
        }

        channel.send(quoteEmbed)
    }

    getHelpText() {
        return "`&addquote <message>`\nAdd a quote. \nIf the command is called by replying to another message, the message being replied to will be used.\n" + 
                "`&q`\nGet a quote."
    }
}