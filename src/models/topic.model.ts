import { Schema, model, Types, Document } from "mongoose";

export interface ITopic extends Document {
	_id: Types.ObjectId;
	name: string;
}

const topicSchema = new Schema<ITopic>(
	{
		name: { type: String, required: true, trim: true },
	},
	{ timestamps: true },
);

topicSchema.index({ name: "text" });

export default model<ITopic>("Topic", topicSchema);
