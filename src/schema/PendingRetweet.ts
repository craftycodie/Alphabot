import { Document, model, Schema } from "mongoose"
import PendingRetweet from "../models/PendingRetweet"

// Schema
const PendingRetweetSchema = new Schema<PendingRetweetDocument>({
  approvalMessageID: {
    type: String,
    required: true
  },
  tweetID: {
    type: String,
    required: true
  },
  discordUserID: {
    type: String,
    required: true
  }
})

interface PendingRetweetDocument extends Document, PendingRetweet {}

// Default export
export default model<PendingRetweetDocument>("PendingRetweet", PendingRetweetSchema)