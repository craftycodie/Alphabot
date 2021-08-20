import { Document, model, Schema } from "mongoose"
import Quote from "../models/Quote"

const QuoteSchema = new Schema<QuoteDocument>({
  text: {
    type: String,
    required: true,
    unique: true
  },
  addedBy: {
    type: String,
    required: true,
  },
  quoteFrom: {
    type: String,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  containsURL: {
    type: Boolean,
    required: true,
    default: false
  }
})

export interface QuoteDocument extends Document, Quote {}

export default model<QuoteDocument>("Quote", QuoteSchema)