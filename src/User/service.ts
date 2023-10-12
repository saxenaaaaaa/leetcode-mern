import { Types } from "mongoose";
import { generatePassword } from "../helpers/password";
import { SubmissionModel, UserModel } from "../model-exports";
import { Password, User, UserDTO } from "./model";
import { Problem, Submission, SubmissionDTO } from "../Problems/model";
import { Ref } from "@typegoose/typegoose";
import { fetchProblemById } from "../Problems/service";
import { verify } from "crypto";

export const findUser = async (user: User) => {
    if (user.emailId) {
        return findUserByEmail(user.emailId);
    }
    if (user.userName) {
        return findUserByUserName(user.userName);
    }
}

export const findUserByEmail = async (emailId: string) => {
    return await UserModel.findOne(UserModel.where({ emailId: emailId }));
}

export const findUserByUserName = async (userName: string) => {
    return UserModel.findOne(UserModel.where({ userName: userName }));
}

export const fetchUserSubmissionsForProblem = async (userEmailId: string, problemId: string) => {
    const user = await findUserByEmail(userEmailId);
    const problem = await fetchProblemById(problemId);
    if (user && problem) {
        const submissions = await SubmissionModel.find({
            author: user?._id,
            problem: new Types.ObjectId(problemId)
        });
        return submissions.map((submission) => {
            return {
                submissionId: submission._id,
                problemId: problem._id.toString(),
                problemTitle: problem.title,
                author: user.fullName,
                code: submission.code,
                language: submission.language,
                verdict: submission.verdict
            } as SubmissionDTO;
        });
    }
    return [];
}

export const fetchAllSubmissionsByUser = async (userEmailId: string) => {
    const user = await findUserByEmail(userEmailId);
    if (user) {
        // If we don't use generics in populate method below, typescript does not recognise fields of submission.problem . 
        // E.g. submission.problem.title would give and error. See - https://mongoosejs.com/docs/typescript/populate.html
        const submissions = await SubmissionModel.find({
            author: user?._id
        }).populate<{ problem: Problem & Types.ObjectId}>('problem', ['_id', 'title']);

        return submissions.map((submission) => {
            return {
                submissionId: submission._id,
                problemId: submission.problem._id.toString(),
                problemTitle: submission.problem.title,
                author: user.fullName,
                code: submission.code,
                language: submission.language,
                verdict: submission.verdict
            } as SubmissionDTO;
        });
    }
    return [];
}

export const createNewUser = async (userDto: UserDTO) => {

    const generated = await generatePassword(userDto.password!);
    const generatedPassword = new Password();
    generatedPassword.hash = generated.hash;
    generatedPassword.salt = generated.salt;
    let userDbo: {[key: string]: any} = {
        emailId: userDto.emailId,
        userName: userDto.userName,
        firstName: userDto.firstName,
        password: generatedPassword,
    }
    if(userDto.lastName) userDbo.lastName = userDto.lastName;
    if(userDto.contact) userDbo.contact = userDto.contact;
    if(userDto.isAdmin) userDbo.isAdmin = userDto.isAdmin;
    const user = await UserModel.create(userDbo);
    await user.save();
}

export const hasValidCredentials = async (emailId: string, password: string) => {

    const user = await findUserByEmail(emailId) as User;
    // console.log("Found User : ", user);
    if (user) {
        return await user.password.verify(password);
    }
    return false;
}

export const fetchAllUsers = async () => {
    // console.log("Calling fetch all users.");
    return await UserModel.find({});
}