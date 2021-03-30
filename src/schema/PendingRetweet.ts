import { Document, model, Schema } from "mongoose"
import PendingRetweet from "../models/PendingRetweet"

// Schema
const PendingRetweetSchema = new Schema<PendingRetweetDocument>({
  firstName: {
    type: String,
    required: true
  },
  lastName: String,
  username: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },
  gender: {
    type: Number,
    enum: [0, 1],
    default: 0,
    required: true
  },
  friends: [{
    type: String,
  }],
  creditCards: {
    type: Map,
    of: String
  }
})

interface PendingRetweetDocument extends Document, PendingRetweet {}

// Default export
export default model<PendingRetweetDocument>("PendingRetweet", PendingRetweetSchema)