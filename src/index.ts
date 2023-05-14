// External dependencies
import dotenv from "dotenv";
import express from "express";

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

const port = process.env.PORT || "5172";
app.listen(port, () => {
	console.log(`Server is running on port http://127.0.0.1/${port}`);
});

export default app;
