import { Schema, model, Types, Document } from "mongoose";

export interface IComment extends Document {
	_id: Types.ObjectId;
	name: string;
}

const commentSchema = new Schema<IComment>(
	{
		name: { type: String, required: true, trim: true },
	},
	{ timestamps: true },
);

export default model<IComment>("Comment", commentSchema);
