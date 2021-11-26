import fetch from "node-fetch"
import ogs from "open-graph-scraper"
import moment from "moment"

export default class GitHubService {
    private rateLimitReset = 0

    public getRepo = async (username, reponame) => {
        this.checkRateLimit();

        var res = await fetch(
            `https://api.github.com/repos/${username}/${reponame}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                },
            },
        )

        await this.getRateLimit(res)

        if (res.status != 200)
            throw new Error(res.statusText);
        
        return await res.json();
    }

    public getLatestRelease = async (username, reponame) => {
        this.checkRateLimit();

        var res = await fetch(
            `https://api.github.com/repos/${username}/${reponame}/releases/latest`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                },
            },
        )

        await this.getRateLimit(res)

        if (res.status != 200)
            throw new Error(res.statusText);
        
        return await res.json();
    }

    public getIssue = async (username, reponame, issueNumber) => {
        this.checkRateLimit();

        var res = await fetch(
            `https://api.github.com/repos/${username}/${reponame}/issues/${issueNumber}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                },
            },
        )

        await this.getRateLimit(res)

        if (res.status != 200)
            throw new Error(res.statusText);
        
        return await res.json();
    }

    public getPulLRequest = async (username, reponame, issueNumber) => {
        this.checkRateLimit();

        var res = await fetch(
            `https://api.github.com/repos/${username}/${reponame}/pulls/${issueNumber}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                },
            },
        )

        await this.getRateLimit(res)

        if (res.status != 200)
            throw new Error(res.statusText);
        
        return await res.json();
    }

    public async getRepoReadmeImageURL(username, reponame) {
        var og = await ogs({ url: `https://github.com/${username}/${reponame}` })
        // Ignore avatars.
        if (og.result.ogImage && og.result.ogImage.url.indexOf("avatars.githubusercontent.com/u") != -1)
            return null
        return og.result.ogImage?.url
    }

    private checkRateLimit = () => {
        if (this.rateLimitReset > new Date().getTime() / 1000)
            throw new Error("Rate limit exceeded. Please try again in " + moment().to(new Date(this.rateLimitReset * 1000)))
    }

    private getRateLimit = async (res) => {
        if (res.status == 403 && res.statusText == "rate limit exceeded") {
            var rateLimitRes = await fetch(
                `https://api.github.com/rate_limit`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    },
                },
            )
            
            this.rateLimitReset = (await rateLimitRes.json()).resources.core.reset

            await this.checkRateLimit()
        }
    }
}