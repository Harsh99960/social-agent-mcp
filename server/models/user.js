import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        bluesky: {
            handle: {
                type: String,
                trim: true,
                default: null,
            },

            appPassword: {
                type: String,
                default: null,
            },

            connected: {
                type: Boolean,
                default: false,
            },
        }, // updated: stores the user's Bluesky connection details
    },
    {
        timestamps: true, // updated: automatically adds createdAt and updatedAt
    }
);

const User = mongoose.model("User", userSchema);

export default User;