import { Schema, model, Types, Document } from "mongoose";
import { IUser } from "./user";
import { IComment } from "./comment";

export interface IPost extends Document {
	_id: Types.ObjectId;
	title: string;
	content: string;
	author: Types.ObjectId | IUser;
	createdAt: Date;
	updatedAt: Date;
	published: boolean;
	tags?: Types.Array<string>;
	comments?: Types.DocumentArray<Types.ObjectId | IComment>;
	likes?: Types.DocumentArray<Types.ObjectId | IUser>;
}

const postSchema = new Schema<IPost>(
	{
		title: { type: String, required: true, trim: true, maxlength: 100 },
		content: { type: String, required: true, trim: true },
		author: { type: Types.ObjectId, ref: "User", required: true },
		published: { type: Boolean, required: true, default: false },
		tags: [{ type: String, trim: true }],
		comments: [{ type: Types.ObjectId, ref: "Comment" }],
		likes: [{ type: Types.ObjectId, ref: "User" }],
	},
	{ timestamps: true },
);

export default model<IPost>("Post", postSchema);
