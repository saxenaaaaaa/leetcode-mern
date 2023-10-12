import { Types } from "mongoose";
import { User } from "../User/model";
import { ProblemModel, SubmissionModel, UserModel } from "../model-exports";
import { Problem, ProblemDTO, ProblemTestCase, Submission, SubmissionDTO } from "./model";
import { findUserByEmail } from "../User/service";
import { evaluateSolution } from "./helpers";

export const fetchAllProblems = async () => {
    return await fetchProblemsWithConditionAndSelect();
}

export const fetchProblemsWithConditionAndSelect = async (query: any = {}, fields: string[] = []) => {
    return await ProblemModel.find(query).select(fields);
}

export const fetchProblemById = async (id: string) => {
    return await ProblemModel.findById(new Types.ObjectId(id));
}

export const submitSolutionForProblem = async(submissionDto: SubmissionDTO, userData: any) => {
    try {
        const problem = await fetchProblemById(submissionDto.problemId);
        const user = await findUserByEmail(userData.emailId);
        const submissionDbo: {[key: string]: any} = {
            problem: new Types.ObjectId(submissionDto.problemId),
            author: user!._id,
            code: submissionDto.code,
            language: submissionDto.language
        }
        const verdict = await evaluateSolution(submissionDto, problem);
        submissionDbo.verdict = verdict;
        const submission = await SubmissionModel.create(submissionDbo);
        await submission.save();
        return submission;
    } catch(error) {
        throw error; // todo: check how to do proper error handling
    }
}

export const fetchProblemDetailsById = async(problemId: string) => {
    try {
        // 1. If we don't use generics in populate method below, typescript does not recognise fields of problem.author. E.g. problem.author.firstName would give and error. See - https://mongoosejs.com/docs/typescript/populate.html
        // 2. Inside populate, we are populating fields firstName and lastName inspite of the fact that we need the virtual field fullName. But, since the 
        //    virtual fullName is calculated on the fly using firstName and lastName, if we do not populate firstName and lastName, the virtual calculation
        //    gets undefined when it tries to use this.firstName. Now, populating firstName and lastName is enough to access fullName.
        //    An important conclusion is that populating any virtual translates populating all the fields which are used to calculate that virtual.
        const problem = await ProblemModel.findById(new Types.ObjectId(problemId)).populate<{author: User}>('author', ['firstName', 'lastName']);
        if(problem && problem.populated('author')) {
            const testCases = problem?.problemTestCases.filter(problemTestCase => problemTestCase.isPublic).map(problemTestCase => {
                return {
                    input: problemTestCase.testCase.input,
                    output: problemTestCase.testCase.output,
                    isPublic: problemTestCase.isPublic
                } 
            });
            return {
                problemId: problem._id,
                author: problem.author.fullName, // fullName is a virtual which is not directly populated. But we can access it since we have populated the fields on which this virtual is dependent
                title: problem.title,
                testCases: testCases,
                description: problem.description,
                constraints: {
                    timeLimit: problem.constraints.timeLimit,
                    memoryLimit: problem.constraints.memoryLimit
                }

            } as ProblemDTO
        }
        throw new Error("problem does not exist");
    } catch(error) {
        throw error; // todo: check how to do proper error handling
    }
}

export const addNewProblem = async(problemDto: ProblemDTO, author: any) => { // todo: check what should be the data type of author parameter here.
    
    const problemTestCases = problemDto.testCases.map(problemTestCase => {
        return {
            isPublic: problemTestCase.isPublic ?? false,
            testCase: {
                input: problemTestCase.input,
                output: problemTestCase.output
            }
        } as ProblemTestCase // todo: we need to check how creation of nested classes happens in typegoose and how do such objects get persisted in db
    });
    const problem = await ProblemModel.create({
        title: problemDto.title,
        problemTestCases: problemTestCases,
        description: problemDto.description,
        constraints: problemDto.constraints,
        author: author._id
    })
    await problem.save();
    return problem;  // todo: check the right way to achieve this
}