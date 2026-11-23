import { CstParser, type CstNode } from 'chevrotain';
import {
    DoubleQuoteString,
    SingleQuoteString,
    LBrace,
    RBrace,
    LBracket,
    RBracket,
    LParen,
    RParen,
    ByteArraySign,
    IntArraySign,
    LongArraySign,
    Colon,
    Comma,
    BinaryNumber,
    HexNumber,
    DecimalNumber,
    TrueToken,
    FalseToken,
    PlusToken,
    MinusToken,
    PowToken,
    MultiplyToken,
    DivideToken,
    ModToken,
    NumericSuffix,
    Identifier,
    KeyIdentifier,
    allTokens
} from './tokens';

export class ExpressionParser extends CstParser {
    public expression!:()=>CstNode;
    public addition!:()=>CstNode;
    public additionOperator!:()=>CstNode;
    public multiplication!:()=>CstNode;
    public multiplicationOperator!:()=>CstNode;
    public modulo!:()=>CstNode;
    public exponentiation!:()=>CstNode;
    public primary!:()=>CstNode;
    public nbt!:()=>CstNode;
    public numeric!:()=>CstNode;
    public string!:()=>CstNode;
    public listLike!:()=>CstNode;
    public compound!:()=>CstNode;
    public compoundKey!:()=>CstNode;

    constructor() {
        super(allTokens);

        const $ = this;

        $.RULE("expression",()=>{
            $.SUBRULE($.addition)
        });

        $.RULE("addition",()=>{
            $.SUBRULE($.multiplication);
            $.MANY(()=>{
                $.SUBRULE($.additionOperator);
                $.SUBRULE2($.multiplication);
            });
        });

        $.RULE("additionOperator",()=>{
            $.OR([
                {ALT:()=>$.CONSUME(PlusToken)},
                {ALT:()=>$.CONSUME(MinusToken)}
            ]);
        });

        $.RULE("multiplication",()=>{
            $.SUBRULE($.modulo);
            $.MANY(()=>{
                $.SUBRULE($.multiplicationOperator);
                $.SUBRULE2($.modulo);
            });
        });

        $.RULE("multiplicationOperator",()=>{
            $.OR([
                {ALT:()=>$.CONSUME(MultiplyToken)},
                {ALT:()=>$.CONSUME(DivideToken)}
            ]);
        });

        $.RULE("modulo",()=>{
            $.SUBRULE($.exponentiation);
            $.OPTION(()=>{
                $.CONSUME(ModToken);
                $.SUBRULE2($.exponentiation);
            });
        });

        $.RULE("exponentiation",()=>{
            $.SUBRULE($.primary);
            $.OPTION(()=>{
                $.CONSUME(PowToken);
                $.SUBRULE2($.primary);
            });
        });

        $.RULE("primary",()=>{
            $.OR([
                {ALT:()=>{
                    $.CONSUME(Identifier);
                    $.CONSUME2(LParen);
                    $.MANY_SEP({
                        SEP: Comma,
                        DEF: ()=>$.SUBRULE($.nbt)
                    });
                    $.OPTION(()=>$.CONSUME3(Comma));
                    $.CONSUME4(RParen);
                }},
                {ALT:()=>{
                    $.CONSUME(LParen);
                    $.SUBRULE2($.expression);
                    $.CONSUME2(RParen);
                }},
                {ALT:()=>{
                    $.SUBRULE3($.compound);
                }},
                {ALT:()=>{
                    $.SUBRULE4($.numeric);
                }}
            ]);
        });

        $.RULE("nbt",()=>{
            $.OR([
                {
                    GATE:()=>this.LA(2).tokenType !== LParen,
                    ALT:()=>$.SUBRULE($.string)
                },
                {ALT:()=>$.SUBRULE($.listLike)},
                {ALT:()=>$.SUBRULE($.expression)}
            ]);
        });

        $.RULE("numeric",()=>{
            $.OR([
                {ALT: ()=>{
                    $.CONSUME(TrueToken);
                }},
                {ALT: ()=>{
                    $.CONSUME(FalseToken);
                }},
                {ALT: ()=>{
                    $.OR2([
                        {
                            ALT: ()=>{
                                $.CONSUME(BinaryNumber);
                            }
                        },
                        {
                            ALT: ()=>{
                                $.CONSUME(HexNumber);
                            }
                        },
                        {
                            ALT: ()=>{
                                $.CONSUME(DecimalNumber);
                            }
                        }
                    ]);
                    
                    $.OPTION(()=>$.CONSUME(NumericSuffix));
                }}
            ]);
        });

        $.RULE("string",()=>{
            $.OR([
                {ALT:()=>$.CONSUME(Identifier)},
                {ALT:()=>$.CONSUME(SingleQuoteString)},
                {ALT:()=>$.CONSUME(DoubleQuoteString)}
            ]);
        });

        $.RULE("listLike",()=>{
            $.CONSUME(LBracket);
            $.OPTION(()=>{
                $.OR([
                    {ALT:()=>$.CONSUME(ByteArraySign)},
                    {ALT:()=>$.CONSUME(IntArraySign)},
                    {ALT:()=>$.CONSUME(LongArraySign)}
                ]);
            });
            $.MANY_SEP({
                SEP: Comma,
                DEF: ()=>{
                    $.SUBRULE($.nbt)
                }
            });
            $.OPTION2(()=>$.CONSUME(Comma));
            $.CONSUME3(RBracket);
        });

        $.RULE("compound",()=>{
            $.CONSUME(LBrace);
            $.MANY_SEP({
                SEP: Comma,
                DEF: ()=>{
                    $.SUBRULE($.compoundKey);
                    $.CONSUME(Colon);
                    $.SUBRULE2($.nbt);
                }
            });
            $.OPTION(()=>$.CONSUME(Comma));
            $.CONSUME2(RBrace)
        });

        $.RULE("compoundKey",()=>{
            $.OR([
                {ALT:()=>$.CONSUME(SingleQuoteString)},
                {ALT:()=>$.CONSUME(DoubleQuoteString)},
                {ALT:()=>{
                    $.OR2([
                        {ALT:()=>$.CONSUME(Identifier)},
                        {ALT:()=>$.CONSUME(KeyIdentifier)},
                        {ALT:()=>$.CONSUME(MinusToken)},
                        {ALT:()=>$.CONSUME(PlusToken)},
                        {ALT:()=>$.CONSUME(DecimalNumber)},
                        {ALT:()=>$.CONSUME(HexNumber)},
                        {ALT:()=>$.CONSUME(BinaryNumber)}
                    ]);
                    $.MANY(()=>{
                        $.OR3([
                            {
                                GATE: ()=>{
                                    const prev = this.LA(0);
                                    const next = this.LA(1);

                                    return next.startOffset === (prev.endOffset ?? -2) + 1;
                                },
                                ALT: ()=>{
                                    $.OR4([
                                        {ALT:()=>$.CONSUME2(Identifier)},
                                        {ALT:()=>$.CONSUME2(KeyIdentifier)},
                                        {ALT:()=>$.CONSUME2(MinusToken)},
                                        {ALT:()=>$.CONSUME2(PlusToken)},
                                        {ALT:()=>$.CONSUME2(NumericSuffix)},
                                        {ALT:()=>$.CONSUME2(DecimalNumber)},
                                        {ALT:()=>$.CONSUME2(HexNumber)},
                                        {ALT:()=>$.CONSUME2(BinaryNumber)}
                                    ]);
                                }
                            }
                        ]);
                    });
                }}
            ]);
        });

        $.performSelfAnalysis();
    }
}