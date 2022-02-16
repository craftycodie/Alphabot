import events from "../events"
import IModule from "./IModule"
import { Interaction, Message, MessageActionRow, MessageButton, TextChannel } from "discord.js"

export default class CardModule implements IModule {
    getRandomIntInclusive = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    registerModule() {
        events.onDiscordCommand(this.flipCommand)
        events.onDiscordInteraction(this.onYellowButton)
        events.onDiscordInteraction(this.onRedButton)
    }

    unregisterModule() {
        events.offDiscordCommand(this.flipCommand)
        events.offDiscordInteraction(this.onYellowButton)
        events.offDiscordInteraction(this.onRedButton)
    }

    private onYellowButton = async (interaction: Interaction) => {
        if (interaction.isButton() && interaction.customId == "yellow") {
            interaction.deferUpdate()
            const fetchedMsg = await interaction.channel.messages.fetch(interaction.message.id);
            await fetchedMsg.channel.send("🟨 @everyone A yellow card has been raised.");
        }
    }

    private onRedButton = async (interaction: Interaction) => {
        if (interaction.isButton() && interaction.customId == "red") {
            interaction.deferUpdate()
            const fetchedMsg = await interaction.channel.messages.fetch(interaction.message.id);
            await fetchedMsg.channel.send("🟥 @everyone A red card has been raised. Please pause the session.");
        }
    }

    getHelpText() {
        return null
    }

    flipCommand = (message : Message, name : string, args : string[]) => {
      if (name == "setupcards" && message.channel.type === "GUILD_TEXT") {
          message.channel.send(this.cardSelect())
      }
    }

    private cardSelect = () => {
        const row = new MessageActionRow().addComponents(
            new MessageButton()
            .setLabel('Yellow')
            .setCustomId('yellow')
            .setStyle('SECONDARY'),
            new MessageButton()
            .setLabel('Red')
            .setCustomId('red')
            .setStyle('DANGER')
        );

        return { content: 
            "**X Cards:\n\n**" +
            "This channel is dedicated to a safety tool, intended for use during genuine upset or discomfort, not simply when you wish the way things were going in the session would change. (if we think of yellow cards as veils, and red cards as lines).\n\n"+
            "A 🟨 (yellow) card is an indication that a scene is fine continuing, but maybe we pull back, or redirect/refocus. A 🟥  (red) card means the **SESSION IS PAUSED**, we take a 5 minute break, reassess where we're at, and rewind/retcon, and do what we can to prevent further discomfort.\n\n"+
            "This is **COMPLETELY ANONYMOUS**, and while the goal is that it shouldn't have to be used, it is important that it is here if it needs to be.", components: [row] };
    }
}