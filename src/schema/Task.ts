import { Document, model, Schema } from "mongoose"
import Task from "../models/Task"

const TaskSchema = new Schema<TaskDocument>({
  description: {
    type: String,
    required: true
  },
  createdAt: {
    type: Number,
    required: true
  },
})

interface TaskDocument extends Document, Task {}

export default model<TaskDocument>("Task", TaskSchema)