import events from "../events"
import IModule from "./IModule"
import { MessageEmbed } from "discord.js"
import GitHubService from "../services/GitHubService"

export default class GitHubModule implements IModule {
    githubService = new GitHubService()

    registerModule() {
        events.onDiscordCommand(async (message, name, args) => {
            if (name == "github") {
                if (args.length != 1 || args[0].indexOf("/") == -1) {
                    message.channel.send("& Invalid arguments. &")
                    return;
                }

                var [username, reponame] = args[0].split("/")

                try {
                    if (reponame.indexOf("#") != -1) {
                        var [reponame, issue] = reponame.split("#")

                        if (issue == "new")
                            message.channel.send(await this.githubNewIssueEmbed(username, reponame))
                        else
                            message.channel.send(await this.githubIssueEmbed(username, reponame, issue))
                    } else {
                        message.channel.send(await this.githubRepoEmbed(username, reponame))
                    }
                } catch (error) {
                    message.channel.send(`& ${error} &`)
                }
            }
        })
    }

    private async githubIssueEmbed(username, reponame, issueNumber) {
        var issue = null;

        try {
            issue = await this.githubService.getIssue(username, reponame, issueNumber)
        } catch (error) {
            throw new Error("Could not find GitHub issue.")
        }

        var repo = null;

        try {
            repo = await this.githubService.getRepo(username, reponame)
        } catch {
            throw new Error("Could not find GitHub repository.")
        }

        var pullRequest = ("pull_request" in issue)

        const issueEmbed = new MessageEmbed()
            .setColor('#171515')
            .setTitle(`${repo.owner.login}/${repo.name} #${issue.number}`)
            .setURL(issue.html_url)
            .setAuthor(`${issue.user.login}`, issue.user.avatar_url)
            .setTimestamp(new Date(issue.updated_at).getTime())
            .setDescription(pullRequest ? "Pull Request" :`**${issue.title}**\n${issue.body}`)
            .setFooter("GitHub", "https://github.githubassets.com/favicons/favicon-dark.png")

        return issueEmbed
    }

    private async githubNewIssueEmbed(username, reponame) {
        var repo = null;

        try {
            repo = await this.githubService.getRepo(username, reponame)
        } catch {
            throw new Error("Could not find GitHub repository.")
        }

        const repoEmbed = new MessageEmbed()
            .setColor('#171515')
            .setTitle("Report A Bug")
            .setURL(repo.html_url + "/issues/new")
            .setAuthor(`${repo.owner.login}/${repo.name}`, repo.owner.avatar_url)
            .setFooter("GitHub", "https://github.githubassets.com/favicons/favicon-dark.png")

        return repoEmbed
    }

    private async githubRepoEmbed(username, reponame) {
        var repo = null;
        var latestRelease = null;

        try {
            repo = await this.githubService.getRepo(username, reponame)
        } catch (error) {
            throw new Error("Could not find GitHub repository.")
        }

        try {
            latestRelease = await this.githubService.getLatestRelease(username, reponame)
        } catch {
            // ignore.
        }

        var repoImageURL = await this.githubService.getRepoReadmeImageURL(username, reponame)

        const repoEmbed = new MessageEmbed()
            .setColor('#171515')
            .setTitle(repo.name)
            .setURL(repo.html_url)
            .setAuthor(repo.owner.login, repo.owner.avatar_url)
            .setDescription(repo.description)
            .setImage(repoImageURL)
            .setTimestamp(new Date(repo.updated_at).getTime())
            .setFooter("GitHub", "https://github.githubassets.com/favicons/favicon-dark.png")

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

        return repoEmbed
    }

    getHelpText() {
        return "`&github <username>/<reponame>`\nShow information about a GitHub repo.\n"
            + "`&github <username>/<reponame>#<issue number>`\nShow information about a GitHub issue or pull request."
            + "`&github <username>/<reponame>#new`\nProvides a link to create a new issue."
    }
}