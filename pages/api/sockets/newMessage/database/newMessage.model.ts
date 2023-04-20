import { Schema, model, models } from "mongoose";

const newMessage = new Schema(
  {
    notification: {
      type: Number,
      require: [true, "newMessage is required"],
      unique: false,
      trim: true,
      min: [10, "notification must have at least 2 digits"],
      max: [99, "notification can have a maximum of 2 digits"],
      default: 0,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export default models.newMessage || model("newMessage", newMessage);
