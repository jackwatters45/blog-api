import type { Application } from "express";
import comment from "./comment";
import post from "./post";
import user from "./user";

const API_VERSION = "/api/v1";

const configRoutes = (app: Application) => {
	app.use(`${API_VERSION}/users`, user);
	app.use(`${API_VERSION}/posts`, post);
	app.use(`${API_VERSION}/comments`, comment);
};

export default configRoutes;
