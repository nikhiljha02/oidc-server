import mongoose from "mongoose";

const codeSchema = new mongoose.Schema(
  {
    authcode: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    clientId: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
const authCodeSchema = mongoose.model("Codes", codeSchema);

export default authCodeSchema;
