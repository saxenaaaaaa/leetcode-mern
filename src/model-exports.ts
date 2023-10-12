import { getModelForClass } from "@typegoose/typegoose";
import { User } from "./User/model";
import { Problem, Submission } from "./Problems/model";

export const UserModel = getModelForClass(User);
export const ProblemModel = getModelForClass(Problem);
export const SubmissionModel = getModelForClass(Submission);