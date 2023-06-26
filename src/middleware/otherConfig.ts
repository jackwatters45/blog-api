import express, { Application } from "express";
import logger from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";

const configOtherMiddleware = (app: Application) => {
	app.use(logger("dev"));
	app.use(express.json());
	app.use(express.urlencoded({ extended: false }));
	app.use(cookieParser(process.env.SESSION_SECRET as string));
	app.use(
		cors({
			origin: [
				"http://blog-api-frontend-self.vercel.app",
				"https://blog-api-frontend-self.vercel.app",
				"http://localhost:5173",
				"https://localhost:5173",
			],
			credentials: true,
		}),
	);
};

export default configOtherMiddleware;
