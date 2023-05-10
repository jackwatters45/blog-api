// External dependencies
import dotenv from "dotenv";
import express from "express";

// Internal dependencies
import configDb from "./config/database";
import routes from "./routes";
import configAuthMiddleware from "./middleware/authConfig";
import configProdMiddleware from "./middleware/prodConfig";
import configOtherMiddleware from "./middleware/otherConfig";
import configErrorMiddleware from "./middleware/errorConfig";

dotenv.config();

const app = express();

// config middleware + mongoDB
configAuthMiddleware(app);
configOtherMiddleware(app);
configProdMiddleware(app);
configDb();

// Routes
app.use("/users", routes.user);
app.use("/posts", routes.post);
app.use("/comments", routes.comment);

// config error middleware
configErrorMiddleware(app);

const port = process.env.PORT || "5173";
app.listen(port, () => {
	console.log(`Server is running on port http://127.0.0.1/${port}`);
});

export default app;
