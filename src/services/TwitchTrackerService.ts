import fetch from 'node-fetch'
import sleep from '../utils/sleep'

export default class TwitchTrackerService {
    private static readonly POLL_FREQUENCY_SECONDS = 30

    channels : string[] = []
    onLive :  (stream: any) => void = null
    running = false
    previousStreams : Map<string, number> = new Map()

    constructor(channels : string[], onLive : (stream: any) => void) {
        this.channels = channels
        this.onLive = onLive
        this.checkStreams(true)
    }

    public start = async () => {
        console.debug("& Starting twitch tracker.")
        this.running = true
        
        while (this.running) {
            await sleep(TwitchTrackerService.POLL_FREQUENCY_SECONDS * 1000)
            await this.checkStreams(false)
        }
    }

    public stop = () => {
        this.running = false;
    }

    public setChannels = (channels : string[]) => {
        this.channels = channels
    }

    private checkStreams = async (getInitial: boolean = false) => {
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
            if (!getInitial && (!this.previousStreams.has(stream.user_login) || this.previousStreams.get(stream.user_login) < new Date(stream.started_at).getTime()))
                this.onLive(stream)

            this.previousStreams.set(stream.user_login, new Date(stream.started_at).getTime())
        })
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