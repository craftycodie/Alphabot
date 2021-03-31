import fetch from "node-fetch"
import ogs from "open-graph-scraper"
import moment from "moment"

export default class MineOnlineService {
    public getServer = async (host, port) => {
        var res = await fetch(
            `https://mineonline.codie.gg/api/getserver?serverIP=${host}&port=${port}`,
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
}