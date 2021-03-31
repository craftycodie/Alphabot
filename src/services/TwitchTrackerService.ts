import fetch from 'node-fetch'
import sleep from '../utils/sleep'

export default class TwitchTrackerService {
    channels : string[] = []
    lastChecked = new Date()
    onLive :  (stream: any) => void = null
    running = false

    constructor(channels : string[], onLive : (stream: any) => void) {
        this.channels = channels
        this.onLive = onLive
    }

    public start = async () => {
        console.debug("& Starting twitch tracker.")
        this.running = true
        
        while (this.running) {
            await sleep(30000)
            await this.checkStreams()
        }
    }

    public stop = () => {
        this.running = false;
    }

    public setChannels = (channels : string[]) => {
        this.channels = channels
    }

    private checkStreams = async () => {
        var access_token = await this.authenticate()

        var streams : any[] = (await (await fetch(
            `https://api.twitch.tv/helix/streams?user_login=${this.channels.join("&user_login=")}&first=100`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'client-id': process.env.TWITCH_CLIENT_ID,
                    'Authorization': "Bearer " + access_token
                },
            },
        )).json()).data

        streams.forEach(stream => {
            if (new Date(stream.started_at) > this.lastChecked) {
                this.onLive(stream)
            }
        })

        this.lastChecked = new Date()

        return streams
    }

    private authenticate = async () : Promise<string> => {
        return (await (await fetch(
            `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
            },
        )).json()).access_token
    }

}