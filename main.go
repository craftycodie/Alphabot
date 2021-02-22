package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/bwmarrin/discordgo"
	"github.com/joho/godotenv"
)

// Variables used for command line parameters
var (
	token string
	guild string
)

const (
	prefix = "&"
	ver    = "Alphabot | 0.0.1"
)

func init() {
	godotenv.Load()
	token = os.Getenv("DISCORD_BOT_TOKEN")
	guild = os.Getenv("DISCORD_BOT_GUILD")
}

func main() {

	// Create a new Discord session using the provided bot token.
	discord, err := discordgo.New("Bot " + token)
	if err != nil {
		fmt.Println("error creating Discord session,", err)
		return
	}

	// Register the messageCreate func as a callback for MessageCreate events.
	discord.AddHandler(messageCreate)

	discord.Identify.Intents = discordgo.IntentsGuildMessages

	// Open a websocket connection to Discord and begin listening.
	err = discord.Open()
	if err != nil {
		fmt.Println("error opening connection,", err)
		return
	}

	// Wait here until CTRL-C or other term signal is received.
	fmt.Println("Bot is now running.  Press CTRL-C to exit.")
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc

	// Cleanly close down the Discord session.
	discord.Close()
}

// This function will be called (due to AddHandler above) every time a new
// message is created on any channel that the authenticated bot has access to.
func messageCreate(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Only listen to the provided guild.
	if m.GuildID != guild {
		return
	} 

	// Ignore all messages created by the bot itself
	// This isn't required in this specific example but it's a good practice.
	if m.Author.ID == s.State.User.ID {
		return
	}
	// If the message is "ping" reply with "Pong!"
	if m.Content == prefix+"hi" {
		s.ChannelMessageSend(m.ChannelID, "Why hello there! Im Alphabot!")
		s.ChannelMessageSend(m.ChannelID, "You can take a peek at my development over at \n github.com/ampersanddevs/alphabot")
	}
	if m.Content == prefix+"ver" {
		s.ChannelMessageSend(m.ChannelID, ver)
	}

}
