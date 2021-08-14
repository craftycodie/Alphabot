import { Document, model, Schema } from "mongoose"
import WhitelistRequest from "../models/WhitelistRequest"

const WhitelistRequestSchema = new Schema<WhitelistRequestDocument>({
  approvalMessageID: {
    type: String,
    required: true
  },
  minecraftUsername: {
    type: String,
    unique: true,
    required: true
  },
  discordUserID: {
    type: String,
    required: true
  },
  approved: {
    type: Boolean,
    required: true,
    default: false
  }
})

interface WhitelistRequestDocument extends Document, WhitelistRequest {}

export default model<WhitelistRequestDocument>("WhitelistRequest", WhitelistRequestSchema)