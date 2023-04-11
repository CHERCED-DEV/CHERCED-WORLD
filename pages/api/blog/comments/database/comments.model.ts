import { Schema, model, models } from "mongoose";

const messageSchema = new Schema(
  {
    postId: {
      type: String,
      require: [true, "PostId is required"],
      unique: false,
      trim: true,
      maxlength: [6, "PostId must be less than 6 characters"],
    },
    date: {
      type: String,
      require: [true, "Date is required"],
      unique: false,
      trim: true,
      maxlength: [20, "Date must be less than 20 characters"],
    },
    email: {
      type: String,
      require: [true, "Email is required"],
      unique: false,
      trim: true,
      maxlength: [35, "Email must be less than 35 characters"],
    },
    userName: {
      type: String,
      require: [true, "User Name is required"],
      unique: false,
      trim: true,
      maxlength: [25, "User Name must be less than 25 characters"],
    },
    comment: {
      type: String,
      require: [true, "Comment is required"],
      unique: false,
      trim: true,
      maxlength: [600, "Comment must be less than 600 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default models.Comment || model("Comment", messageSchema);
