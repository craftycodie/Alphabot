import { Document, model, Schema } from "mongoose"
import Event from "../models/Event"

const EventSchema = new Schema<EventDocument>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: false
  },
  timestamp: {
    type: Number,
    required: false
  },
})

interface EventDocument extends Document, Event {}

export default model<EventDocument>("Event", EventSchema)