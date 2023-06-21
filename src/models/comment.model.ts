import { Schema, model, Types, Document } from "mongoose";
import autopopulate from "mongoose-autopopulate";
import { IUser } from "./user.model";
import { IPost } from "./post.model";

export interface IComment extends Document {
	_id: Types.ObjectId;
	content: string;
	author: Types.ObjectId | IUser;
	createdAt: Date;
	updatedAt: Date;
	post: Types.ObjectId | IPost;
	likes: Types.ObjectId[];
	dislikes: Types.ObjectId[];
	isDeleted: boolean;
	parentComment?: Types.ObjectId | IComment;
	replies: Types.ObjectId[];
}

const commentSchema = new Schema<IComment>(
	{
		content: { type: String, required: true, trim: true },
		author: {
			type: Types.ObjectId,
			ref: "User",
			required: true,
			autopopulate: {
				select: "firstName lastName avatarUrl isDeleted",
			},
		},
		post: { type: Types.ObjectId, ref: "Post", required: true },
		likes: [{ type: Types.ObjectId, ref: "User", default: [] }],
		dislikes: [{ type: Types.ObjectId, ref: "User", default: [] }],
		isDeleted: { type: Boolean, default: false },
		parentComment: {
			type: Schema.Types.ObjectId,
			ref: "Comment",
		},
		replies: [
			{ type: Schema.Types.ObjectId, ref: "Comment", autopopulate: true },
		],
	},
	{ timestamps: true },
);

commentSchema.plugin(autopopulate);

export default model<IComment>("Comment", commentSchema);
