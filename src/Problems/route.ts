import express, { Router } from "express"
import * as problemsController from "./controller";
import { isAuthenticated, validateAdmin } from "../User/session-controller";
import { validate } from "../helpers/validate";
import { addProblemValidatorChain, submitProblemValidatorChain } from "./validate";
const router: Router = express.Router();

export const problemsRouter = () => {
    router.get("/all", problemsController.allProblems);
    router.get("/details/:problemId", problemsController.problemDetails);
    router.post("/add", isAuthenticated, validateAdmin, addProblemValidatorChain(), validate,  problemsController.addProblem);
    router.post("/submit", isAuthenticated, submitProblemValidatorChain(), validate, problemsController.submit);
    return router;
}