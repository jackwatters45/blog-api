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
	tags?: Types.Array<string>;
	comments?: Types.Array<Types.ObjectId | IComment>;
}

const postSchema = new Schema<IPost>(
	{
		title: { type: String, required: true, trim: true, maxlength: 100 },
		content: { type: String, required: true, trim: true },
		author: { type: Types.ObjectId, ref: "User", required: true },
		tags: [{ type: String, trim: true }],
		comments: [{ type: Types.ObjectId, ref: "Comment" }],
	},
	{ timestamps: true },
);

export default model<IPost>("Post", postSchema);
