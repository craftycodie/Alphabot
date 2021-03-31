import { Document, model, Schema } from "mongoose"
import Streamer from "../models/Streamer"

const StreamerSchema = new Schema<StreamerDocument>({
  twitchChannel: {
    type: String,
    required: true
  },
  addedByDiscordUserID: {
    type: String,
    required: true
  }
})

interface StreamerDocument extends Document, Streamer {}

export default model<StreamerDocument>("Streamer", StreamerSchema)