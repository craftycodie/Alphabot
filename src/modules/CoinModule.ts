import events from "../events"
import IModule from "./IModule"
import { Message } from "discord.js"

export default class CoinModule implements IModule {
    getRandomIntInclusive = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    registerModule() {
        events.onDiscordCommand(this.flipCommand)
    }

    unregisterModule() {
        events.offDiscordCommand(this.flipCommand)
    }

    getHelpText() {
        return "`&flip\nFlip a coin.'"
    }

    flipCommand = (message : Message, name : string, args : string[]) => {
      if (name == "flip") {
          const lucky = this.getRandomIntInclusive(0, 1) == 1;
          message.channel.send(`You flipped a coin, it landed on the **${lucky ? "Lucky" : "Unlucky"}** side.`)
      }
    }
}