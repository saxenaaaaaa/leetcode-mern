import { Verdict } from "../helpers/constants";
import { SubmissionDTO } from "./model";

export const evaluateSolution = async(submissionDto: SubmissionDTO, problem: any) => {
    return Object.values(Verdict)[Math.floor(Math.random()*2)];
}