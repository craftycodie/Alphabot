import events from "../events"
import IModule from "./IModule"
import { Interaction, Message, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, TextChannel } from "discord.js"
import discordBotClient from "../discord/discordBotClient"

export default class UpdaterModule implements IModule {
    registerModule() {
        discordBotClient.on('message', this.sayCommand)
        events.onDiscordInteraction(this.onSelectChannel)
        events.onDiscordInteraction(this.onSendButton)
        events.onDiscordInteraction(this.onCancelButton)
    }

    unregisterModule() {
        discordBotClient.off('message', this.sayCommand)
        events.offDiscordInteraction(this.onSelectChannel)
        events.offDiscordInteraction(this.onSendButton)
        events.offDiscordInteraction(this.onCancelButton)
    }

    private onSelectChannel = async (interaction: Interaction) => {
        var guild = await discordBotClient.guilds.fetch(process.env.DISCORD_GUILD_ID)
        var channels = await guild.channels.fetch()

        if (interaction.isSelectMenu() && interaction.customId == "select") {
            const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('select')
                    .setPlaceholder('Nothing selected')
                    .addOptions(channels.filter(channel => channel.type == "GUILD_TEXT").map(channel => { return { 
                        label: '#' + channel.name,
                        value: channel.id,
                        default: channel.id == interaction.values[0]
                     }})));
    
            const row2 = new MessageActionRow().addComponents(
                new MessageButton()
                .setLabel('Cancel')
                .setCustomId('cancel')
                .setStyle('DANGER'),
                new MessageButton()
                .setLabel('Send')
                .setCustomId('send')
                .setStyle('SUCCESS')
            );
    
            await interaction.update({ content: 'You lend your voice to a God from a different realm.', embeds: interaction.message.embeds, components: [row, row2] });
        }
    }

    private onSendButton = async (interaction: Interaction) => {
        if (interaction.isButton() && interaction.customId == "send") {
            var guild = await discordBotClient.guilds.fetch(process.env.DISCORD_GUILD_ID)

            var selectMenu = interaction.message.components[0].components[0];

            if (selectMenu.type != "SELECT_MENU") return

            var channel = await guild.channels.fetch(selectMenu.options.filter(option => option.default)[0].value)

            if (channel.type != "GUILD_TEXT") return

            await channel.send({ embeds: interaction.message.embeds })
    
            const fetchedMsg = await interaction.channel.messages.fetch(interaction.message.id);
            await fetchedMsg.delete();
        }
    }

    private onCancelButton = async (interaction: Interaction) => {
        if (interaction.isButton() && interaction.customId == "cancel") {    
            const fetchedMsg = await interaction.channel.messages.fetch(interaction.message.id);
            await fetchedMsg.delete();
        }
    }

    private sayCommand = async (message: Message) => {
        if (message.channel.type == "DM") {
            if (message.author.id != "537334651631435826" && message.author.id != "273529217042481152") return
            this.sendChannelSelect(message);
        }
    }

    private sendChannelSelect = async (message: Message) => {
        var guild = await discordBotClient.guilds.fetch(process.env.DISCORD_GUILD_ID)
        var channels = await guild.channels.fetch()

        const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('select')
                .setPlaceholder('Nothing selected')
                .addOptions(channels.filter(channel => channel.type == "GUILD_TEXT").map(channel => { return { 
                    label: '#' + channel.name,
                    value: channel.id,
                 } })));

        const row2 = new MessageActionRow().addComponents(
            new MessageButton()
            .setLabel('Cancel')
            .setCustomId('cancel')
            .setStyle('DANGER'),
            new MessageButton()
            .setLabel('Send')
            .setCustomId('send')
            .setStyle('SUCCESS')
            .setDisabled(true)
        );

        const quoteEmbed = new MessageEmbed()
            .setColor('#DD2E44')
            .setFooter(`Added by ${discordBotClient.user.username} on ${new Date().toDateString()}.`)

        // quoteEmbed.setAuthor(discordBotClient.user.username, discordBotClient.user.avatarURL())

        var text = message.content;
        if (text.length > 256) {
            quoteEmbed.setDescription(`***"${text}" - ${discordBotClient.user.username}***`)
        } else {
            quoteEmbed.setTitle(`*"${text}" - ${discordBotClient.user.username}*`)
        }

        await message.reply({ content: 'You lend your voice to a God from a different realm.', embeds: [quoteEmbed], components: [row, row2] });
    }

    getHelpText() {
        return null
    }
}