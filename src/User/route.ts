import express, { Router } from "express";
import * as userController from "./controller";
import { signInValidatorChain, signUpValidatorChain } from "./validate";
import { validate } from "../helpers/validate";
import { isAuthenticated, isLoggedOut } from "./session-controller";

const router: Router = express.Router();

export const userRouter = () => {
    router.post("/signUp", signUpValidatorChain(), validate, isLoggedOut, userController.signUpUser);
    router.post("/signIn", signInValidatorChain(), validate, isLoggedOut, userController.signInUser);
    router.get("/submissions/:problemId", isAuthenticated, userController.getUserSubmissionsForProblem);
    router.get("/allSubmissions", isAuthenticated, userController.getAllUserSubmissions);

    
    // router.post("/updateProfile", userController.updateUser);
    return router;
}