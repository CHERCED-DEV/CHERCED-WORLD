import { Schema, model, models } from "mongoose";

const messageSchema = new Schema(
  {
    name: {
      type: String,
      require: [true, "Name is required"],
      unique: false,
      trim: true,
      maxlength: [60, "Name must be less than 60 characters"],
    },
    email: {
      type: String,
      require: [true, "Email is required"],
      unique: false,
      trim: true,
      maxlength: [60, "Email must be less than 60 characters"],
    },
    phone: {
      type: Number,
      require: [true, "Phone is required"],
      unique: false,
      trim: true,
      maxlength: [15, "Phone must be less than 15 characters"],
    },
    message: {
      type: String,
      require: [true, "Message is required"],
      unique: false,
      trim: true,
      maxlength: [400, "Message must be less than 400 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default models.Message || model("Message", messageSchema);
