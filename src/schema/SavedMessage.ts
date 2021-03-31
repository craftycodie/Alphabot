import { Document, model, Schema } from "mongoose"
import SavedMessage from "../models/SavedMessage"

const SavedMessageSchema = new Schema<SavedMessageDocument>({
  name: {
    type: String,
    required: true
  },
  guildID: {
    type: String,
    required: true
  },
  channelID: {
    type: String,
    required: true
  },
  messageID: {
    type: String,
    required: true
  }
})

interface SavedMessageDocument extends Document, SavedMessage {}

export default model<SavedMessageDocument>("SavedMessage", SavedMessageSchema)