import { Schema, model, Types, Document } from "mongoose";
import { IUser } from "./user.model";
import { IPost } from "./post.model";

export interface IComment extends Document {
	_id: Types.ObjectId;
	content: string;
	author: Types.ObjectId | IUser;
	createdAt: Date;
	updatedAt: Date;
	post: Types.ObjectId | IPost;
}

const commentSchema = new Schema<IComment>(
	{
		content: { type: String, required: true, trim: true },
		author: { type: Types.ObjectId, ref: "User", required: true },
		post: { type: Types.ObjectId, ref: "Post", required: true },
	},
	{ timestamps: true },
);

export default model<IComment>("Comment", commentSchema);
