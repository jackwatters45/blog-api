// External dependencies
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import https from "https";

// Internal dependencies
import configAuthMiddleware from "./middleware/authConfig";
import configOtherMiddleware from "./middleware/otherConfig";
import configProdMiddleware from "./middleware/prodConfig";
import configDb from "./config/database";
import configRoutes from "./routes";
import configErrorMiddleware from "./middleware/errorConfig";

dotenv.config();

const app = express();

// config middleware + mongoDB
configAuthMiddleware(app);
configOtherMiddleware(app);
configProdMiddleware(app);
configDb();

// Config Routes
configRoutes(app);

// config error middleware
configErrorMiddleware(app);

const options = {
	key: fs.readFileSync("127.0.0.1-key.pem"),
	cert: fs.readFileSync("127.0.0.1.pem"),
};

const port = process.env.PORT || "5172";

https.createServer(options, app).listen(port, () => {
	console.log(`Server is running on port https://127.0.0.1/${port}`);
});

export default app;
