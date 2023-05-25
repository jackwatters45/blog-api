import { Schema, model, Types, Document } from "mongoose";
// import bcrypt from "bcryptjs";

export interface IUser extends Document {
	_id: Types.ObjectId;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
	username: string;
	url: string;
	password: string;
	createdAt: Date;
	updatedAt: Date;
	userType: string;
	followers: Types.ObjectId[];
	following: Types.ObjectId[];
	description?: string;
}

const UserSchema = new Schema<IUser>(
	{
		firstName: { type: String, required: true, trim: true, maxlength: 25 },
		lastName: { type: String, required: true, trim: true, maxlength: 25 },
		email: { type: String, required: true, trim: true, unique: true },
		username: { type: String, required: true, trim: true, unique: true },
		password: { type: String, required: true, trim: true, minlength: 8 },
		userType: {
			type: String,
			required: true,
			trim: true,
			default: "user",
			enum: ["user", "admin"],
		},
		followers: [{ type: Types.ObjectId, ref: "User", default: [] }],
		following: [{ type: Types.ObjectId, ref: "User", default: [] }],
		description: { type: String, trim: true },
	},
	{ timestamps: true },
);

UserSchema.virtual("fullName").get(function (this: IUser) {
	return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual("url").get(function (this: IUser) {
	return `https://.blogName.com/users/${this.username}`;
});

// TODO
// UserSchema.pre("save", function (next) {
// 	if (this.isModified("password") || this.isNew) {
// 		this.password = bcrypt.hashSync(this.password, 10);
// 	}
// 	next();
// });

// UserSchema.methods.comparePassword = function (password: string) {
// 	return bcrypt.compareSync(password, this.password);
// };

UserSchema.index({
	firstName: "text",
	lastName: "text",
	email: "text",
	username: "text",
});

export default model<IUser>("User", UserSchema);
