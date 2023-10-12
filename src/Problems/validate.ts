import { body } from "express-validator"
import { Language } from "../helpers/constants"
import { ProblemModel } from "../model-exports"
import { Types } from "mongoose"

export const addProblemValidatorChain = () => {
    return [
        body("title").trim().notEmpty().withMessage("Problem title cannot be empty."),
        body("description").trim().notEmpty().withMessage("Problem description cannot be empty."),
        body("testCases").isArray({ min: 1 }).withMessage("Atleast one test case must be provided for the problem."),
        body("testCases.*.input").trim().notEmpty().withMessage("No problem testcase can have empty input."),
        body("testCases.*.output").trim().notEmpty().withMessage("No problem testcase can have empty output."),
        body("testCases").custom(testCases => testCases.filter((testCase: any) => testCase.isPublic).length > 0).withMessage("Atleast one testcase for the problem must be public"),
        body("constraints.timeLimit").isNumeric().withMessage("Problem time limit must be a numeric value representing time limit in milliseconds."),
        body("constraints.memoryLimit").isNumeric().withMessage("Problem memory limit must be a numeric value representing memory limit in KBs.")
    ]
}

export const submitProblemValidatorChain = () => {
    return [
        body("problemId").trim().notEmpty().withMessage("ProblemId not provided for submission.").custom(checkValidProblemId).withMessage("Invalid problemId"),
        body("code").trim().notEmpty().withMessage("Please provide code to submit."),
        body("language").trim().isIn(Object.values(Language))
    ]
}

async function checkValidProblemId(problemId: string) {
    const problem = await ProblemModel.findById(new Types.ObjectId(problemId));
    if(problem) {
        return true;
    }
    return false;
}