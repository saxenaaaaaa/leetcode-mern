import { NextFunction, Request, Response } from "express";
import { createNewUser, hasValidCredentials, fetchAllUsers, findUserByEmail, fetchUserSubmissionsForProblem, fetchAllSubmissionsByUser } from "./service";
import { AuthenticationMethod, authInUse, extractSessionData, isLoggedOut } from "./session-controller";
import jwt from "jsonwebtoken";
import { secretKey } from "./session-controller";
import { UserDTO } from "./model";

// Test this API first. And then change error handling of every other API.
export const signUpUser = async function (request: Request, response: Response, next?: NextFunction) {
    response.promise(async () => {
        const userDto: UserDTO = request.body;
        await createNewUser(userDto);
        let responseData: {[key: string]: any} = {
            message: "User Signup Successful"
        }
        if(authInUse == AuthenticationMethod.SESSION) {
            request.session.userData = {
                emailId: userDto.emailId
            }
        }
        else if(authInUse == AuthenticationMethod.JWT) {
            // todo: This kind of jwt token is unique per user. Hence it will be the same for the same user's different sessions. 
            // This will not allow multiple-devices login. Or multiple sessions at the same time. Check how to build multi-login using jwt.
            responseData.token = jwt.sign({emailId: userDto.emailId}, secretKey);
        }
        return responseData;
    });
}

export const signInUser = async function (request: Request, response: Response, next?: NextFunction) {
    try{
        const {emailId, password } = request.body;
        const valid = await hasValidCredentials(emailId, password)
        if(valid) {
            let responseData:{[key: string]: any} = {
                message: "User SignIn Successful"
            }
            if(authInUse == AuthenticationMethod.SESSION) {
                request.session.userData = {
                    emailId: emailId  // tells express-sesion to save emailId as session data for this session in session-store.
                }
            }
            else if(authInUse == AuthenticationMethod.JWT) {
                responseData.token = jwt.sign({emailId: emailId}, secretKey); // return back the signed jwt for client to use in all subsequent requests.
            }
            response.status(200).json(responseData);
        }
        else {
            response.status(403).json({message: "Unable to signin user. Invalid Credentials!"});
        }
    } catch(err) {
        throw err; // todo: check how to do proper error handling
    }
}

export const getUserSubmissionsForProblem = async function (request: Request, response: Response, next?: NextFunction) {
    try {
        const userData = extractSessionData(request);
        const problemId = request.params.problemId;
        const submissions = await fetchUserSubmissionsForProblem(userData.emailId, problemId);
        response.status(200).send({
            submissions: submissions
        });
    } catch(err) {
        // console.log("Did we reach here ?");
        throw new Error()
        throw err; // todo: check how to do proper error handling
    }
}

export const getAllUserSubmissions = async function (request: Request, response: Response, next?: NextFunction) {
    try {
        const userData = extractSessionData(request);
        const submissions = await fetchAllSubmissionsByUser(userData.emailId);
        response.status(200).send({
            submissions: submissions
        });
    } catch(err) {
        throw err; // todo: check how to do proper error handling
    }
}

