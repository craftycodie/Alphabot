import events from "../events"
import IModule from "./IModule"
import { MessageEmbed } from "discord.js"
import GitHubService from "../services/GitHubService"

export default class GitHubModule implements IModule {
    githubService = new GitHubService()

    registerModule() {
        events.onDiscordCommand(async (message, name, args) => {
            if (name == "github") {
                var repo = null;
                var latestRelease = null;

                if (args.length != 1 || args[0].indexOf("/") == -1) {
                    message.channel.send("& Invalid arguments. &")
                    return;
                }

                var [username, reponame] = args[0].split("/")

                try {
                    repo = await this.githubService.getRepo(username, reponame)
                } catch {
                    message.channel.send("& Could not find GitHub repository. &")
                    return;
                }

                try {
                    latestRelease = await this.githubService.getLatestRelease(username, reponame)
                } catch {
                    // ignore.
                }

                var repoImageURL = await this.githubService.getRepoReadmeImageURL(username, reponame)

                const helpEmbed = new MessageEmbed()
                    .setColor('#171515')
                    .setTitle(repo.name)
                    .setURL(repo.html_url)
                    .setAuthor(repo.owner.login, repo.owner.avatar_url)
                    .setDescription(repo.description)
                    .setImage(repoImageURL)
                    .addFields([
                        { 
                            inline: true,
                            name: "Stars",
                            value: repo.stargazers_count
                        },
                        { 
                            inline: true,
                            name: "Forks",
                            value: repo.forks_count
                        },
                        { 
                            inline: true,
                            name: "Issues",
                            value: repo.open_issues_count
                        }
                    ])
                    .addFields([
                        { 
                            inline: true,
                            name: "Homepage",
                            value: repo.homepage != null ? repo.homepage : "No Homepage"
                        },
                        { 
                            inline: true,
                            name: "Latest Release",
                            value: latestRelease != null ? latestRelease.name : "No Releases"
                        },
                        { 
                            inline: true,
                            name: "Language",
                            value: repo.language
                        }
                    ])

                message.channel.send(helpEmbed)
            }
        })
    }

    getHelpText() {
        return "`&github <username>/<reponame>`\nShow information about a GitHub repo."
    }
}