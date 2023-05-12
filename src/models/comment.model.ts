import { Schema, model, Types, Document } from "mongoose";
import { IUser } from "./user.model";

export interface IComment extends Document {
	_id: Types.ObjectId;
	content: string;
	author: Types.ObjectId | IUser;
	createdAt: Date;
	updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
	{
		content: { type: String, required: true, trim: true },
		author: { type: Types.ObjectId, ref: "User", required: true },
	},
	{ timestamps: true },
);

export default model<IComment>("Comment", commentSchema);
