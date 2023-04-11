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
      maxlength: [100, "Email must be less than 100 characters"],
    },
    userName: {
      type: String,
      require: [true, "User Name is required"],
      unique: false,
      trim: true,
      maxlength: [100, "User Name must be less than 100 characters"],
    },
    comment: {
      type: String,
      require: [true, "Comment is required"],
      unique: false,
      trim: true,
      maxlength: [1000, "Comment must be less than 1000 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default models.Comment || model("Comment", messageSchema);
