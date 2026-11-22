import rawCharNames from '../data/charNames.json';
import { ExpressionParser } from './parser';
import type { CharNames, SourceLocation, Tag, TagCompound, TagList, TagString, VisitorError } from './types';

const charNames:CharNames = rawCharNames;

const parser = new ExpressionParser();
const BaseVisitor = parser.getBaseCstVisitorConstructor();

function parseString(input:string):string {
    let str = input.substring(1,input.length - 1);
    let i = 0;
    let result = '';

    while (str[i]) {
        let char = str[i];
        if (char === '\\') {
            i ++;
            char = str[i];

            switch (char) {
                case "x":
                    result += String.fromCharCode(parseInt(str.substring(i+1,i+1+2),16));
                    i += 2;
                    continue;
                case "u":
                    result += String.fromCharCode(parseInt(str.substring(i+1,i+1+4),16));
                    i += 4;
                    continue;
                case "U":
                    const code = parseInt(str.substring(i+1,i+1+8),16);

                    if (code > 0x10ffff) {
                        throw Error('Invalid Unicode point');
                    }
                    result += String.fromCharCode(code);
                    i += 8;
                    continue;
                case "N":
                    i++;
                    let charName = '';
                    while ((/^[ \t\v\f]$/).test(str[i])) {
                        i++;
                    }
                    while (str[i] !== '}') {
                        charName += str[i];
                        i ++;
                    }
                    
                    const codePointHex = charNames[charName.replace(/[ \t\v\f]+$/,'').toUpperCase()];

                    if (!codePointHex) {
                        throw Error('Invalid char name');
                    }

                    result += String.fromCharCode(parseInt(codePointHex,16));
                    i ++;
                    continue;
                case '"':
                    result += '"';
                    continue;
                case "'":
                    result += "'";
                    continue;
                case "\\":
                    result += '\\';
                    continue;
                case "b":
                    result += '\b';
                    continue;
                case "s":
                    result += ' ';
                    continue;
                case "t":
                    result += '\t';
                    continue;
                case "n":
                    result += '\n';
                    continue;
                case "f":
                    result += '\f';
                    continue;
                case "r":
                    result += '\r';
                    continue;
            }
        }
        result += char;

        i ++;
    }

    return result;
}

export class InterpretVisitor extends BaseVisitor {
    public errors:VisitorError[] = [];

    constructor() {
        super();
        this.validateVisitor();
    }

    initialExpression(ctx:any) {
        this.errors = [];

        return {
            tag: this.visit(ctx) as Tag,
            errors: this.errors
        };
    }

    expression(ctx:any): TagCompound {
        return this.visit(ctx.addition);
    }
    
    addition(ctx:any): Tag {
        const firstItem = this.visit(ctx.multiplication[0]) as Tag;

        if (ctx.multiplication && ctx.multiplication?.length === 1) {
            return firstItem;
        }

        const firstOp = this.visit(ctx.additionOperator[0]) as ("+" | "-");

        let resultCompound: TagCompound = firstOp === "+" ? {
            type: "compound",
            value: {
                type: {
                    tag: {
                        type: "string",
                        value: "add"
                    }
                },
                inputs: {
                    tag: {
                        type: "list",
                        value: [
                            firstItem
                        ]
                    }
                }
            }
        } : {
            type: "compound",
            value: {
                type: {
                    tag: {
                        type: "string",
                        value: "sub"
                    }
                },
                left: {
                    tag: firstItem
                }
            }
        };

        for (let i = 0; i < (ctx.additionOperator ?? []).length; i++) {
            let item = this.visit(ctx.multiplication[i + 1]) as Tag;
            let op = this.visit(ctx.additionOperator[i]) as ("+" | "-");

            if (op === "-") {
                if (i === 0) {
                    resultCompound.value.right = {tag:item};
                    continue;
                }

                resultCompound = {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "sub"
                            }
                        },
                        left: {
                            tag: resultCompound
                        },
                        right: {
                            tag: item
                        }
                    }
                };
            } else {
                if (!("inputs" in resultCompound.value)) {
                    resultCompound = {
                        type: "compound",
                        value: {
                            type: {
                                tag: {
                                    type: "string",
                                    value: "add"
                                }
                            },
                            inputs: {
                                tag: {
                                    type: "list",
                                    value: [resultCompound]
                                }
                            }
                        }
                    }
                }
                (resultCompound.value.inputs.tag as TagList).value.push(item);
            }
        }

        return resultCompound;
    }

    additionOperator(ctx:any) {
        return ctx.PlusToken ? "+" : "-";
    }

    multiplication(ctx:any): Tag {
        const firstItem = this.visit(ctx.modulo[0]) as Tag;

        if (ctx.modulo && ctx.modulo?.length === 1) {
            return firstItem;
        }
        
        const firstOp = this.visit(ctx.multiplicationOperator[0]) as ("*" | "/");

        let resultCompound: TagCompound = firstOp === "*" ? {
            type: "compound",
            value: {
                type: {
                    tag: {
                        type: "string",
                        value: "mul"
                    }
                },
                inputs: {
                    tag: {
                        type: "list",
                        value: [
                            firstItem
                        ]
                    }
                }
            }
        } : {
            type: "compound",
            value: {
                type: {
                    tag: {
                        type: "string",
                        value: "div"
                    }
                },
                left: {
                    tag: firstItem
                }
            }
        };

        for (let i = 0; i < (ctx.multiplicationOperator ?? []).length; i++) {
            let item = this.visit(ctx.modulo[i + 1]) as Tag;
            let op = this.visit(ctx.multiplicationOperator[i]) as ("*" | "/");

            if (op === "/") {
                if (i === 0) {
                    resultCompound.value.right = {tag:item};
                    continue;
                }

                resultCompound = {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "div"
                            }
                        },
                        left: {
                            tag: resultCompound
                        },
                        right: {
                            tag: item
                        }
                    }
                };
            } else {
                if (!("inputs" in resultCompound.value)) {
                    resultCompound = {
                        type: "compound",
                        value: {
                            type: {
                                tag: {
                                    type: "string",
                                    value: "mul"
                                }
                            },
                            inputs: {
                                tag: {
                                    type: "list",
                                    value: [resultCompound]
                                }
                            }
                        }
                    }
                }
                (resultCompound.value.inputs.tag as TagList).value.push(item);
            }
        }

        return resultCompound;
    }

    multiplicationOperator(ctx:any) {
        return ctx.MultiplyToken ? "*" : "/";
    }

    modulo(ctx:any): Tag {
        if (!ctx.ModToken) {
            return this.visit(ctx.exponentiation[0]) as Tag;
        }

        const resultCompound: TagCompound = {
            type: "compound",
            value: {
                type: {
                    tag: {
                        type: "string",
                        value: "mod"
                    }
                },
                left: {
                    tag: this.visit(ctx.exponentiation[0]) as Tag
                },
                right: {
                    tag: this.visit(ctx.exponentiation[1]) as Tag
                }
            }
        };
        return resultCompound;
    }

    exponentiation(ctx:any): Tag {
        if (!ctx.PowToken) {
            return this.visit(ctx.primary[0]) as Tag;
        }

        const resultCompound: TagCompound = {
            type: "compound",
            value: {
                type: {
                    tag: {
                        type: "string",
                        value: "pow"
                    }
                },
                left: {
                    tag: this.visit(ctx.primary[0]) as Tag
                },
                right: {
                    tag: this.visit(ctx.primary[1]) as Tag
                }
            }
        };
        return resultCompound;
    }

    primary(ctx:any): Tag {
        if (ctx.compound && ctx.compound?.length > 0) {
            return this.visit(ctx.compound) as TagCompound;
        } else if (ctx.numeric && ctx.numeric?.length > 0) {
            return this.visit(ctx.numeric) as Tag;
        } else if (!ctx.Identifier) {
            return this.visit(ctx.expression[0]) as Tag;
        }
        
        let sourceLocation: SourceLocation = {
            startOffset: ctx.Identifier[0].startOffset,
            endOffset: ctx.RParen[0].endOffset,

            startLine: ctx.Identifier[0].startLine,
            endLine: ctx.RParen[0].endLine,

            startColumn: ctx.Identifier[0].startColumn,
            endColumn: ctx.RParen[0].endColumn
        };

        switch (ctx.Identifier[0].image) {
            case "bool": {
                if (!ctx.nbt || ctx.nbt?.length !== 1) {
                    this.errors.push({
                        type: "error",
                        message: "1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation: sourceLocation
                    };
                }

                const argument = this.visit(ctx.nbt[0]) as Tag;
                switch (argument.type) {
                    case "byte":
                    case "short":
                    case "int":
                    case "float":
                    case "double":
                        return argument.value === 0 ? {type:"byte",value:0,sourceLocation:sourceLocation} : {type:"byte",value:1,sourceLocation:sourceLocation};
                    case "long":
                        return argument.value === 0n ? {type:"byte",value:0,sourceLocation:sourceLocation} : {type:"byte",value:1,sourceLocation:sourceLocation};
                    default:
                        this.errors.push({
                            type: "error",
                            message: "number is required",
                            sourceLocation: sourceLocation
                        });
                        return {type:"float",value:NaN,sourceLocation:sourceLocation};
                }
            }
            case "uuid": {
                if (!ctx.nbt || ctx.nbt?.length !== 1) {
                    this.errors.push({
                        type: "error",
                        message: "1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                const argument = this.visit(ctx.exponentiation[0]) as Tag;
                if (argument.type !== "string") {
                    this.errors.push({
                        type: "error",
                        message: "string is required",
                        sourceLocation: sourceLocation
                    });
                    return {type:"float",value:NaN,sourceLocation:sourceLocation};
                }
                if (!(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/).test(argument.value)) {
                    this.errors.push({
                        type: "error",
                        message: "uuid string is required",
                        sourceLocation: sourceLocation
                    });
                    return {type:"float",value:NaN,sourceLocation:sourceLocation};
                }
                const uuidParts = argument.value.split('-');
                let a = parseInt(uuidParts[0],16) >> 0;
                let b = parseInt(uuidParts[1] + uuidParts[2],16) >> 0;
                let c = parseInt(uuidParts[3] + uuidParts[4].substring(0,4),16) >> 0;
                let d = parseInt(uuidParts[4].substring(4),16) >> 0;

                return {
                    type: "int_array",
                    value: [
                        {type:"int",value:a},
                        {type:"int",value:b},
                        {type:"int",value:c},
                        {type:"int",value:d}
                    ],
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "abs": {
                if (!ctx.nbt || ctx.nbt?.length !== 1) {
                    this.errors.push({
                        type: "error",
                        message: "1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "abs"
                            }
                        },
                        input: {
                            tag: this.visit(ctx.nbt[0]) as Tag
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "avg": {
                if (!ctx.nbt || ctx.nbt?.length < 1) {
                    this.errors.push({
                        type: "error",
                        message: "at least 1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "avg"
                            }
                        },
                        inputs: {
                            tag: {
                                type: "list",
                                value: ctx.nbt.map((exp:any)=>this.visit(exp) as Tag)
                            }
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "max": {
                if (!ctx.nbt || ctx.nbt?.length < 1) {
                    this.errors.push({
                        type: "error",
                        message: "at least 1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "max"
                            }
                        },
                        inputs: {
                            tag: {
                                type: "list",
                                value: ctx.nbt.map((exp:any)=>this.visit(exp) as Tag)
                            }
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "min": {
                if (!ctx.nbt || ctx.nbt?.length < 1) {
                    this.errors.push({
                        type: "error",
                        message: "at least 1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "min"
                            }
                        },
                        inputs: {
                            tag: {
                                type: "list",
                                value: ctx.nbt.map((exp:any)=>this.visit(exp) as Tag)
                            }
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "negate": {
                if (!ctx.nbt || ctx.nbt?.length !== 1) {
                    this.errors.push({
                        type: "error",
                        message: "1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "negate"
                            }
                        },
                        input: {
                            tag: this.visit(ctx.nbt[0]) as Tag
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "storage": {
                if (!ctx.nbt || ctx.nbt?.length !== 2) {
                    this.errors.push({
                        type: "error",
                        message: "2 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "storage"
                            }
                        },
                        storage: {
                            tag: this.visit(ctx.nbt[0]) as Tag
                        },
                        path: {
                            tag: this.visit(ctx.nbt[1]) as Tag
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "score": {
                if (!ctx.nbt || ctx.nbt?.length !== 2) {
                    this.errors.push({
                        type: "error",
                        message: "2 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "score"
                            }
                        },
                        target: {
                            tag: {
                                type: "compound",
                                value: {
                                    type: {
                                        tag: {
                                            type: "string",
                                            value: "fixed"
                                        }
                                    },
                                    name: {
                                        tag: this.visit(ctx.nbt[0]) as Tag
                                    }
                                }
                            }
                        },
                        score: {
                            tag: this.visit(ctx.nbt[1]) as Tag
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "cos": {
                if (!ctx.nbt || ctx.nbt?.length !== 1) {
                    this.errors.push({
                        type: "error",
                        message: "1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "cos"
                            }
                        },
                        input: {
                            tag: this.visit(ctx.nbt[0]) as Tag
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "floor": {
                if (!ctx.nbt || ctx.nbt?.length !== 1) {
                    this.errors.push({
                        type: "error",
                        message: "1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "floor"
                            }
                        },
                        input: {
                            tag: this.visit(ctx.nbt[0]) as Tag
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "length": {
                if (!ctx.nbt || ctx.nbt?.length < 1) {
                    this.errors.push({
                        type: "error",
                        message: "at least 1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "length"
                            }
                        },
                        inputs: {
                            tag: {
                                type: "list",
                                value: ctx.nbt.map((exp:any)=>this.visit(exp) as Tag)
                            }
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "round": {
                if (!ctx.nbt || ctx.nbt?.length !== 1) {
                    this.errors.push({
                        type: "error",
                        message: "1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "round"
                            }
                        },
                        input: {
                            tag: this.visit(ctx.nbt[0]) as Tag
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "sin": {
                if (!ctx.nbt || ctx.nbt?.length !== 1) {
                    this.errors.push({
                        type: "error",
                        message: "1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "sin"
                            }
                        },
                        input: {
                            tag: this.visit(ctx.nbt[0]) as Tag
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "sqrt": {
                if (!ctx.nbt || ctx.nbt?.length !== 1) {
                    this.errors.push({
                        type: "error",
                        message: "1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "sqrt"
                            }
                        },
                        input: {
                            tag: this.visit(ctx.nbt[0]) as Tag
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            case "truncate": {
                if (!ctx.nbt || ctx.nbt?.length !== 1) {
                    this.errors.push({
                        type: "error",
                        message: "1 argument is required",
                        sourceLocation: sourceLocation
                    });
                    return {
                        type: "float",
                        value: NaN,
                        sourceLocation:sourceLocation
                    };
                }

                return {
                    type: "compound",
                    value: {
                        type: {
                            tag: {
                                type: "string",
                                value: "truncate"
                            }
                        },
                        input: {
                            tag: this.visit(ctx.nbt[0]) as Tag
                        }
                    },
                    sourceLocation: sourceLocation
                } as Tag;
            }
            default:
                this.errors.push({
                    type: "error",
                    message: "Invalid operator",
                    sourceLocation: sourceLocation
                });
                return {
                    type: "float",
                    value: NaN
                };
        }
    }

    nbt(ctx:any): Tag {
        if (ctx.string && ctx.string?.length > 0) {
            return this.visit(ctx.string[0]);
        }
        if (ctx.listLike && ctx.listLike?.length > 0) {
            return this.visit(ctx.listLike[0]);
        }
        return this.visit(ctx.expression[0]);
    }

    numeric(ctx:any): Tag {
        const valueTokenList = ctx.BinaryNumber ?? ctx.HexNumber ?? ctx.DecimalNumber;
        const valueToken = valueTokenList[0];

        let sourceString:{
            value: string,
            signSuffix: string,
            typeSuffix: string
        } = {
            value: valueToken.image,
            signSuffix: "",
            typeSuffix: ""
        };

        let sourceLocation:SourceLocation = {
            startOffset: valueToken.startOffset,
            endOffset: valueToken.endOffset,
            
            startLine: valueToken.startLine,
            endLine: valueToken.endLine,
            startColumn: valueToken.startColumn,
            endColumn: valueToken.endColumn
        };

        let type: "byte" | "short" | "int" | "long" | "float" | "double" | undefined;

        if (ctx.NumericSuffix) {
            sourceString.typeSuffix = (/[bBsSiIlLfFdD]$/).exec(ctx.NumericSuffix[0].image)![0];

            switch (sourceString.typeSuffix.toLowerCase()) {
                case "b":
                    type = "byte";
                    break;
                case "s":
                    type = "short";
                    break;
                case "i":
                    type = "int";
                    break;
                case "l":
                    type = "long";
                    break;
                case "f":
                    type = "float";
                    break;
                case "d":
                    type = "double";
                    break;
            }

            if (ctx.NumericSuffix[0].image.length === 2) {
                sourceString.signSuffix = ctx.NumericSuffix[0].image[0];
            }
        }
    
        const hasFloatExpression = ctx.DecimalNumber && (/(\.|e)/).test(ctx.DecimalNumber[0].image);

        if (!type) {
            if (hasFloatExpression) {
                type = "double";
            } else {
                type = "int";
            }
        }

        if (type === "float") {
            if (!ctx.DecimalNumber) {
                this.errors.push({
                    type: "error",
                    message: "Invalid float value",
                    sourceLocation: sourceLocation
                });
                return {
                    type: "float",
                    value: NaN
                } as Tag;
            }
            const value = Math.fround(Number(ctx.DecimalNumber[0].image));
            if (!Number.isFinite(value)) {
                this.errors.push({
                    type: "error",
                    message: "Invalid float value",
                    sourceLocation: sourceLocation
                });
            }

            return {
                type: "float",
                value: value,
                sourceLocation: sourceLocation,
                sourceString: sourceString
            };
        }
        if (type === "double") {
            if (!ctx.DecimalNumber) {
                this.errors.push({
                    type: "error",
                    message: "Invalid double value",
                    sourceLocation: sourceLocation
                });
                return {
                    type: "double",
                    value: NaN
                } as Tag;
            }
            const value = Number(ctx.DecimalNumber[0].image);
            if (!Number.isFinite(value)) {
                this.errors.push({
                    type: "error",
                    message: "Invalid double value",
                    sourceLocation: sourceLocation
                });
            }

            return {
                type: "double",
                value: value,
                sourceLocation: sourceLocation,
                sourceString: sourceString
            };
        }

        if (hasFloatExpression) {
            this.errors.push({
                type: "error",
                message: "Invalid " + type + " value",
                sourceLocation: sourceLocation
            });

            return type === "long" ? {
                type: type,
                value: 0n,
                sourceLocation: sourceLocation,
                sourceString: sourceString
            } : {
                type: type,
                value: 0,
                sourceLocation: sourceLocation,
                sourceString: sourceString
            };
        }
        const isSigned = (/^(s|S)$/).test(sourceString.signSuffix)
        ? true
        : (/^(u|U)$/).test(sourceString.signSuffix)
            ? false
            : ctx.DecimalNumber
                ? true
                : false;

        if (type === "long") {
            let value = BigInt(valueToken.image);

            if (!isSigned) {
                if (value < 0n) {
                    this.errors.push({
                        type: "error",
                        message: "Invalid long value",
                        sourceLocation: sourceLocation
                    });

                    return {
                        type: "long",
                        value: 0n
                    };
                }

                if (value > 9223372036854775807n) {
                    value -= 18446744073709551616n;
                }
            }

            return {
                type: "long",
                value: value,
                sourceLocation: sourceLocation,
                sourceString: sourceString
            };
        }

        let value = Number(valueToken.image);

        let max: number;
        switch (type) {
            case "byte": max = 127; break;
            case "short": max = 32767; break;
            case "int": max = 2147483647; break;
        }

        if (!isSigned) {
            if (value < 0) {
                this.errors.push({
                    type: "error",
                    message: "Invalid " + type + " value",
                    sourceLocation: sourceLocation
                });

                return {
                    type: type,
                    value: 0
                };
            }

            if (value > max) {
                value -= (max + 1) * 2;
            }
        }

        return {
            type: type,
            value: value,
            sourceLocation: sourceLocation,
            sourceString: sourceString
        };
    }

    string(ctx:any): TagString {
        if (ctx.Identifier) {
            return {
                type: "string",
                value: ctx.Identifier[0].image,
                sourceLocation: {
                    startOffset: ctx.Identifier[0].startOffset,
                    endOffset: ctx.Identifier[0].endOffset,

                    startLine: ctx.Identifier[0].startLine,
                    endLine: ctx.Identifier[0].endLine,

                    startColumn: ctx.Identifier[0].startColumn,
                    endColumn: ctx.Identifier[0].endColumn
                }
            } as TagString;
        }

        const quoteString = ctx.SingleQuoteString ?? ctx.DoubleQuoteString;
        const sourceLocation: SourceLocation = {
            startOffset: quoteString[0].startOffset,
            endOffset: quoteString[0].endOffset,

            startLine: quoteString[0].startLine,
            endLine: quoteString[0].endLine,

            startColumn: quoteString[0].startColumn,
            endColumn: quoteString[0].endColumn
        };
        const sourceStringValue: string = quoteString[0].image;

        try {
            const content = parseString(sourceStringValue);

            return {
                type: "string",
                value: content,
                sourceLocation: sourceLocation,
                sourceString: {
                    value: sourceStringValue
                }
            } as TagString;
        } catch (e: any) {
            this.errors.push({
                type: "error",
                message: e.message,
                sourceLocation: sourceLocation
            });
            return {
                type: "string",
                value: "ERROR",
                sourceLocation: sourceLocation,
                sourceString: {
                    value: sourceStringValue
                }
            } as TagString;
        }
    }

    listLike(ctx:any): Tag {
        const type = ctx.ByteArraySign
            ? "byte_array"
            : ctx.IntArraySign
            ? "int_array"
            : ctx.LongArraySign
            ? "long_array"
            : "list";
        
        const sourceLocation: SourceLocation = {
            startOffset: ctx.LBracket[0].startOffset,
            endOffset: ctx.RBracket[0].endOffset,
            
            startLine: ctx.LBracket[0].startLine,
            endLine: ctx.RBracket[0].endLine,
        
            startColumn: ctx.LBracket[0].startColumn,
            endColumn: ctx.RBracket[0].endColumn
        };
        let items: Tag[] = [];

        ctx.nbt.forEach((nbt:any)=>{
            let tag = this.visit(nbt) as Tag;

            if (
                type === "byte_array"
                    && tag.type === "int"
                    && tag.sourceString
                    && tag.sourceString.typeSuffix === ""
                    && -128 <= tag.value
                    && tag.value <= 127
            ) {
                tag = {
                    ...tag,
                    type: "byte"
                };
            }

            if (
                type === "long_array"
                    && tag.type === "int"
                    && tag.sourceString
                    && tag.sourceString.typeSuffix === ""
            ) {
                tag = {
                    ...tag,
                    type: "long",
                    value: BigInt(tag.value)
                };
            }

            if (type === "byte_array" && tag.type !== "byte") {
                this.errors.push({
                    type: "error",
                    message: "ByteArray has invalid entry",
                    sourceLocation: sourceLocation
                });
            }
            if (type === "int_array" && tag.type !== "int") {
                this.errors.push({
                    type: "error",
                    message: "IntArray has invalid entry",
                    sourceLocation: sourceLocation
                });
            }
            if (type === "long_array" && tag.type !== "long") {
                this.errors.push({
                    type: "error",
                    message: "LongArray has invalid entry",
                    sourceLocation: sourceLocation
                });
            }

            items.push(tag);
        });

        return {
            type: type,
            value: items,
            sourceLocation: sourceLocation
        } as Tag;
    }

    compound(ctx:any): TagCompound {
        let resultCompound: TagCompound = {
            type: "compound",
            value: {},
            sourceLocation: {
                startOffset: ctx.LBrace[0].startOffset,
                endOffset: ctx.RBrace[0].endOffset,
                
                startLine: ctx.LBrace[0].startLine,
                endLine: ctx.RBrace[0].endLine,
                
                startColumn: ctx.LBrace[0].startColumn,
                endColumn: ctx.RBrace[0].endColumn
            }
        };

        for (let i = 0; i < (ctx.nbt ?? []).length; i++) {
            const keyData = this.visit(ctx.compoundKey[i]) as {value:string,sourceLocation:SourceLocation};
            const TagData = this.visit(ctx.nbt[i]) as Tag;

            resultCompound.value[keyData.value] = {
                tag: TagData,
                sourceLocation: keyData.sourceLocation
            }
        }

        return resultCompound;
    }

    compoundKey(ctx:any): {value:string,sourceLocation:SourceLocation} {
        if (!ctx.SingleQuoteString && !ctx.DoubleQuoteString) {
            const tokens = [
                ...(ctx.Identifier ?? []),
                ...(ctx.KeyIdentifier ?? []),
                ...(ctx.MinusToken ?? []),
                ...(ctx.PlusToken ?? []),
                ...(ctx.NumericSuffix ?? []),
                ...(ctx.DecimalNumber ?? []),
                ...(ctx.HexNumber ?? []),
                ...(ctx.BinaryNumber ?? []),
            ].sort((a,b)=>a.startOffset - b.startOffset);

            return {
                value: tokens.map((token)=>token.image).join(''),
                sourceLocation: {
                    startOffset: tokens[0].startOffset,
                    endOffset: tokens[tokens.length - 1].endOffset,
                    
                    startLine: tokens[0].startLine,
                    endLine: tokens[tokens.length - 1].endLine,

                    startColumn: tokens[0].startColumn,
                    endColumn: tokens[tokens.length - 1].endColumn
                }
            };
        }

        const quoteString = ctx.SingleQuoteString ?? ctx.DoubleQuoteString;
        const sourceLocation: SourceLocation = {
            startOffset: quoteString[0].startOffset,
            endOffset: quoteString[0].endOffset,

            startLine: quoteString[0].startLine,
            endLine: quoteString[0].endLine,

            startColumn: quoteString[0].startColumn,
            endColumn: quoteString[0].endColumn
        };

        try {
            const content = parseString(quoteString[0].image);

            return {
                value: content,
                sourceLocation: sourceLocation,
            };
        } catch (e: any) {
            this.errors.push({
                type: "error",
                message: e.message,
                sourceLocation: sourceLocation
            });
            return {
                value: "ERROR",
                sourceLocation: sourceLocation
            };
        }
    }

    signSuffix(ctx:any): "s"|"S"|"u"|"U" {
        return ctx.SignedShortSuffix[0]?.image ?? ctx.UnsignedSuffix[0]?.image;
    }
}

export const interpretVisitor = new InterpretVisitor();