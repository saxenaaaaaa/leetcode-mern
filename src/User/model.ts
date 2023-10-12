import { prop, Ref, pre, DocumentType, index, plugin } from "@typegoose/typegoose";
import { Language, Verdict } from "../helpers/constants";
import { Problem, Submission } from "../Problems/model";
import isEmail from "validator/lib/isEmail";
import { isValidContactNumber } from "../helpers/validate";
import { generatePassword } from "../helpers/password";
import { Types } from "mongoose";

/**
 * UPDATE - Found out that when 'emitDecoratorMetadata' is true, typescript tries to create metadata for decorators defined by typegoose for each property. 
 *          It tries to reference the Password class there and fails because it is not yet loaded. 
 * 
 * I am defining password before define User class because If I don't, I get the following error - 
 * [1] ReferenceError: Cannot access 'Password' before initialization
[1]     at Object.<anonymous> (/home/utkarsh/workspace/leetcode-mern/dist/User/model.js:80:31)
[1]     at Module._compile (node:internal/modules/cjs/loader:1257:14)
[1]     at Module._extensions..js (node:internal/modules/cjs/loader:1311:10)
[1]     at Module.load (node:internal/modules/cjs/loader:1115:32)
[1]     at Module._load (node:internal/modules/cjs/loader:962:12)
[1]     at Module.require (node:internal/modules/cjs/loader:1139:19)
[1]     at require (node:internal/modules/helpers:121:18)
[1]     at Object.<anonymous> (/home/utkarsh/workspace/leetcode-mern/dist/model-exports.js:5:17)
[1]     at Module._compile (node:internal/modules/cjs/loader:1257:14)
[1]     at Module._extensions..js (node:internal/modules/cjs/loader:1311:10)

 *     I should not get this error ideally and have not seen such error in normal typescript code. This is some issue with typegoose and needs to be solved.
 */
export class Password {
    @prop({
        required: true
    })
    public hash!: string;

    @prop({
        required: true
    })
    public salt!: string;

    public Password(hash: string, salt: string) {
        this.hash = hash;
        this.salt = salt;
    }

    public async verify(this: Password, password: string) {
        const generated = await generatePassword(password, this.salt);
        return generated.hash === this.hash;
    }
}

@plugin((schema) => {
    schema.set('toJSON', { virtuals: true }); // required to include virtuals when the retrieved db object is converted to json
})
@index({userName: 1}, {unique: true})
@index({emailId: 1}, {unique: true})
export class User {

    /**
     * Todo: It is not enough to put a unique constraint on fields, A unique index also needs to be created for each unique field. 
     * Check performance considerations as well if unique indexes are created for every unique field like that.
     */
    
    @prop({
        required: true
    })
    public firstName!: string;
    
    @prop()
    public lastName?: string;

    @prop({
        required: true,
        unique: true
    })
    public userName!: string;

    @prop({
        required: true,
        unique: true, 
        validate: {
            validator: function(emailId: string) {
                return isEmail(emailId);
            },
            message: "Incorrect email address"
        }
    })
    public emailId!: string;
    
    @prop({
        required: true,
        // type: () => Password
    })
    public password!: Password;

    @prop({
        validate: {
            validator: function(value?: string) {
                if(typeof value !== "undefined") {
                    return isValidContactNumber(value);
                }
                return true;
            },
            message: "Please provide a valid contact number"
        }
    })
    public contact?: string; // todo: Should we put a unique constraint on contact number ? Check how unique constraint behaves for non-required fields

    @prop({
        default: false
    })
    public isAdmin?: boolean;

    // @prop({
    //     ref: () => Problem // See: https://typegoose.github.io/typegoose/docs/guides/advanced/reference-other-classes/#referencing-other-classes
    // })
    // public problemsAuthored?: Ref<Problem>[];

    // @prop()
    // public attemptedProblems?: Types.Array<AttemptedProblem>;

    // fullName virtual
    public get fullName() {
        console.log("inside fullname");
        return `${this.firstName} ${this.lastName ?? ""}`;
    }

    public set fullName(fullName: string) {
        let name = fullName.split(' ');
        this.firstName = name[0];
        if(name.length>1) {
            this.lastName=name[1];
        }
    }
}

export interface UserDTO {
    userName: string;
    firstName: string;
    lastName?: string;
    emailId: string;
    password?: string;
    contact?: string;
    isAdmin?: boolean;
}


// @pre<AttemptedProblem>('save', function() {
//     if(this.isModified('verdict') && this.verdict === Verdict.AC) {
//         throw new Error("A problem once accepted cannot be moved to any other submission state");
//     }
//  })
// export class AttemptedProblem {
    
//     @prop({
//         required: true,
//         ref: () => Problem
//     })
//     public problem!: Ref<Problem>;

//     @prop({
//         ref: () => Submission,
//         required: true,
//         validate: {
//             validator: function(value: Submission[]) {
//                 return value.length > 0;
//             },
//             message: "For a problem to be called attempted, there has to be atleast one submisison of the problem."
//         }
//     })
//     public submissions!: Ref<Submission>[];

//     @prop({
//         required: true,
//         enum: Verdict
//     })
//     public verdict!: Verdict;
// }