import express, {Express, Request, Response, NextFunction} from "express";
import session from "express-session";
import dotenv from "dotenv"; 
import mongoose from "mongoose";
import { userRouter } from "./User/route";
import { problemsRouter } from "./Problems/route";
import { user } from "./User/test"
import { AuthenticationMethod, authInUse, sessionCreator } from "./User/session-controller";
import { HttpStatusCode } from "./helpers/response-handler";
import { AppError } from "./helpers/error";

dotenv.config();

const app: Express = express();
const port = process.env.PORT ?? 8000;

app.use(express.urlencoded()); // To parse URL-encoded bodies
app.use(express.json());
if(authInUse == AuthenticationMethod.SESSION) {
    app.use(sessionCreator()); // tells express to use express-session middleware initialized inside session-controller
}

const resourceNotFoundHandler = (request: Request, response: Response, next?: NextFunction) => {
    response.promise(new AppError("Invalid URL path.",HttpStatusCode.NOT_FOUND));
}

const errorHandler = (error: Error, request: Request, response: Response, next?: NextFunction) => {
    response.promise(() => {throw error;});
}

app.use("/user", userRouter());
app.use("/problems", problemsRouter());
app.use(resourceNotFoundHandler);
app.use(errorHandler);

async function initializeServer() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/test");
        console.log("Successfully connected with mongodb");
    } catch(err) {
        console.log(`Error while connecting to mongodb: ${err}`);
    }
}

app.listen(port, async () => {
    await initializeServer();
    console.log(`Node server is running at port ${port}`);
});


