import events from "../events"
import IModule from "./IModule"
import { Message } from "discord.js"

export default class DiceModule implements IModule {
    getRandomIntInclusive = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    registerModule() {
        events.onDiscordCommand(this.rollCommand)
    }

    unregisterModule() {
        events.offDiscordCommand(this.rollCommand)
    }

    rollCommand = (message : Message, name : string, args : string[]) => {
      if (name == "roll") {
          if (args.length < 1) {
              args = ["1d6"]
          }

          if (args.length > 2 || args[0].indexOf("d") < 0 || args[0].split("d").length != 2) {
              message.channel.send("& Invalid arguments. &")
              return
          }

          var [count, sides] = args[0].split("d")
          if (count == "")
              count = "1"
          
          var countParsed = parseInt(count)
          var sidesParsed = parseInt(sides)

          if (countParsed < 1 || sidesParsed < 2 || isNaN(countParsed) || isNaN(sidesParsed)) {
              message.channel.send("& Invalid arguments. &")
              return
          }

          var results = []
          for(var i = 0; i < countParsed; i++) {
              results.push(this.getRandomIntInclusive(1, sidesParsed))
          }

          var resultsText = ""

          if (countParsed > 1) {
              var resultsMinus1 = [...results]
              resultsMinus1.pop();
              resultsText = resultsMinus1.map(r => String(r)).join(", ")
              resultsText += " and a " + results[results.length - 1]
          } else {
              resultsText = results[0]
          }

          if (countParsed == 1 && results[0] == 69)
              resultsText += ". Nice"
          if (countParsed == 1 && results[0] == 1)
              resultsText += " HAHAHAHAHAHAHAHA"

          message.channel.send(`You rolled ${countParsed == 1 ? "a" : countParsed} ${sidesParsed}-sided dice...\nand got a ${resultsText}.`)
      }
    }

    getHelpText() {
        return "`&roll ((count)d<sides>)\nRoll (count) dice of <sides>. Count is optional.`"
    }
}