import fetch from "node-fetch"
import ogs from "open-graph-scraper"

export default class GitHubService {
    public async getRepo(username, reponame) {
        var res = await fetch(
            `https://api.github.com/repos/${username}/${reponame}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                },
            },
        )

        if (res.status != 200)
            throw new Error(res.statusText);
        
        return await res.json();
    }

    public async getLatestRelease(username, reponame) {
        var res = await fetch(
            `https://api.github.com/repos/${username}/${reponame}/releases/latest`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                },
            },
        )

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
}