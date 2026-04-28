import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    appAccess: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return;

  try {
    // Generate a salt and hash the password
    this.password = await bcrypt.hash(this.password, 10);
  } catch (error) {
    console.log(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  // 'this.password' refers to the hashed password in the document
  return await bcrypt.compare(candidatePassword, this.password);
};

let user = mongoose.model("oidc_user", userSchema);
export default user;
