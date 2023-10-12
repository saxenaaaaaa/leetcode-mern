import { NextFunction, Request, Response } from "express";
import { addNewProblem, fetchProblemById, fetchProblemDetailsById, fetchProblemsWithConditionAndSelect, submitSolutionForProblem } from "./service";
import { ProblemDTO, SubmissionDTO } from "./model";
import { extractSessionData } from "../User/session-controller";
import { findUserByEmail } from "../User/service";

export const allProblems = async (request: Request, response: Response, next?: NextFunction) => {
    try {
        const problems = await fetchProblemsWithConditionAndSelect({}, ['title', 'description']);
        response.status(200).json(problems);
    } catch(err) {
        throw err; // todo: check how to do proper error handling
    }
}

export const problemDetails = async (request: Request, response: Response, next?: NextFunction) => {
    try {
        const problemId = request.params.problemId;
        const problemDetails = await fetchProblemDetailsById(problemId);
        response.status(200).json(problemDetails);
    } catch(err) {
        throw err; // todo: check how to do proper error handling
    }
}

export const addProblem = async (request: Request, response: Response, next?: NextFunction) => {
    try {
        const problemDto: ProblemDTO = request.body;
        const userData = extractSessionData(request);
        if(userData) {
            const user = await findUserByEmail(userData.emailId);
            const problem = await addNewProblem(problemDto, user);
            response.status(200).json({
                message: "Problem added successfully",
                problemId: problem._id
            })
        }
        else {
            response.status(500).json({message: "There is some error processing the request. User session data must be present to add a new problem."});
        }
    } catch(err) {
        throw err; // todo: check how to do proper error handling
    }
}

export const submit = async (request: Request, response: Response, next?: NextFunction) => {
    try{
        const submissionDto: SubmissionDTO = request.body;
        const userData = extractSessionData(request);
        if(userData) {
            const submisison = await submitSolutionForProblem(submissionDto, userData);
            response.status(200).json({
                "message": "Submission Successful",
                "submissionId": submisison._id,
                "verdict": submisison.verdict
            });
        }
        else {
            response.status(500).json({message: "There is some error processing the request. User session data must be present to submit solution for a problem."});
        }
    }catch(err) {
        throw err; // todo: check how to do proper error handling
    }
}

