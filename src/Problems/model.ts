import { Ref, getName, plugin, prop } from "@typegoose/typegoose";
import { User } from "../User/model";
import { Language, Verdict } from "../helpers/constants";
import { Types } from "mongoose";

export class Constraints {
    
    @prop({
        required: true
    })
    public timeLimit!: number // in millis

    @prop({
        required: true
    })
    public memoryLimit!: number // in KBs
}

@plugin((schema) => {
    schema.set('toJSON', { virtuals: true }); // required to include virtuals when the retrieved db object is converted to json
})
export class Problem{

    @prop({
        required: true
    })
    public title!: string

    @prop({
        required: true
    })
    public description!: string;

    @prop({
        required: true,
        ref: () => User
    })
    public author!: Ref<User>;

    @prop({
        required: true,
        type: () => ProblemTestCase, // There is no need to mention array in the type here. This is how typegoose works.
        validate: {
            validator: function(value: ProblemTestCase[]) {
                return ((value.length>0) && (value.filter(testCase => testCase.isPublic).length > 0));
            },
            message: "There has to atleast one test case in the problem."
        }
    })
    public problemTestCases!: ProblemTestCase[]

    @prop({
        required: true
    })
    public constraints!: Constraints
}

export class TestCase {
    
    @prop({
        required: true
    })
    public input!: string;

    @prop({
        required: true
    })
    public output!: string;
}

export class ProblemTestCase {

    @prop({
        default: false,
    })
    isPublic?: boolean

    @prop({
        required: true
    })
    public testCase!: TestCase
}

export class Submission {

    @prop({
        required: true,
        ref: () => Problem
    })
    problem!: Ref<Problem>;

    @prop({
        required: true,
        ref: () => User
    })
    author!: Ref<User>;

    @prop({
        required: true,
        enum: Language
    })
    public language!: Language;

    @prop({
        required: true
    })
    public code!: string;

    @prop({
        required: true,
        enum: Verdict
    })
    public verdict!: Verdict
}

export interface ProblemDTO {
    problemId: Types.ObjectId
    title: string;
    description: string;
    testCases: [
        {
            input: string,
            output: string,
            isPublic?: boolean
        }
    ]
    constraints: {
        timeLimit: number,
        memoryLimit: number
    }
    author?: string
}

export interface SubmissionDTO {
    submissionId?: Types.ObjectId;
    problemId: string;
    problemTitle?: string;
    author?: string;
    code: string;
    language: Language;
    verdict?: Verdict;
}