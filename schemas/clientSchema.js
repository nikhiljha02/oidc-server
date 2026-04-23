import mongoose from "mongoose";
import bcrypt from "bcrypt";

const clientSchema = new mongoose.Schema({
    applicationName: {
        type: String,
    },
    applicationUrl: {
        type: String,
    },
    redirectUrl: {
        type: String,
    },
    clientSecret: {
        type: String,
    },
    shortCode: {
        type: String,
    },
});
clientSchema.pre("save", async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("clientSecret")) return;

    try {
        // Generate a salt and hash the password
        this.clientSecret = await bcrypt.hash(this.clientSecret, 10);
    } catch (error) {
        console.log(error);
    }
});

clientSchema.methods.comparePassword = async function (secret) {
    // 'this.password' refers to the hashed password in the document
    return await bcrypt.compare(secret, this.clientSecret);
};
const client = new mongoose.model("Clients", clientSchema);

export default client;
