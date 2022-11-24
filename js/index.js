"use strict";
// noinspection JSUnusedGlobalSymbols
class Application {
    // noinspection JSUnusedGlobalSymbols
    constructor() {
        this.OUT_BUFFER_LINES = 24;
        this.forth = new Forth(this.output.bind(this));
        this.screen = document.getElementById('screen');
        this.outputLog = document.getElementById('output-log');
        this.inputLine = document.getElementById('input-line');
        this.importFile = document.getElementById('import-file');
        this.stackView = document.getElementById('stack-view');
        this.wordsElem = document.getElementById('dictionary');
        this.inputBuffer = [];
        this.inputIndex = 0;
        this.inputLine.addEventListener('keydown', this.inputLine_keydown.bind(this));
        this.importFile.addEventListener('change', this.importFile_change.bind(this));
        this.outputLog.innerText = '';
        this.inputLine.value = '';
        this.stackView.innerText = this.forth.printStack();
        this.outputLog.addEventListener('click', () => this.inputLine.focus());
        this.screen.addEventListener('click', () => this.inputLine.focus());
        document.addEventListener('click', () => this.inputLine.focus());
        this.inputLine.focus();
    }
    inputLine_keydown(event) {
        if (event.code === 'Enter') {
            event.preventDefault();
            const cmdText = this.inputLine.value;
            this.inputLine.value = '';
            this.compileCodeLine(cmdText);
        }
        if (event.code === 'ArrowUp') {
            event.preventDefault();
            if (this.inputBuffer.length > 0)
                this.inputLine.value = this.inputBuffer[this.inputIndex];
            if (this.inputIndex > 0)
                this.inputIndex -= 1;
        }
        if (event.code === 'ArrowDown') {
            event.preventDefault();
            if (this.inputIndex < this.inputBuffer.length - 1) {
                this.inputIndex += 1;
                this.inputLine.value = this.inputBuffer[this.inputIndex];
            }
        }
    }
    importFile_change(event) {
        event.stopPropagation();
        event.preventDefault();
        if (event.target.files instanceof FileList) {
            for (const file of event.target.files) {
                this.readFile(file);
            }
        }
        this.importFile.value = '';
    }
    output(text) {
        this.outputLog.innerText = text.split('\n').slice(-this.OUT_BUFFER_LINES).join('\n');
    }
    compileCodeLine(inputLine) {
        if (inputLine !== '' && (this.inputBuffer.length === 0 ||
            this.inputBuffer[this.inputBuffer.length - 1] !== inputLine)) {
            this.inputBuffer.push(inputLine);
            this.inputIndex = this.inputBuffer.length - 1;
        }
        this.forth.interpret(inputLine);
        this.stackView.innerText = this.forth.printStack();
    }
    readFile(file) {
        const isFile = file instanceof File;
        if (!isFile)
            return;
        const fileReader = new FileReader();
        fileReader.addEventListener('load', this.fileReader_load.bind(this, file.name), false);
        fileReader.readAsText(file, 'ascii');
    }
    fileReader_load(fileName, event) {
        event.stopPropagation();
        event.preventDefault();
        event.target.removeEventListener('load', this.fileReader_load);
        try {
            this.outputLog.innerText += `${fileName} File loaded\n`;
            this.output(this.outputLog.innerText);
            const codeLines = event.target.result.split(/\r?\n/g);
            for (const codeLine of codeLines)
                this.compileCodeLine(codeLine);
        }
        catch (error) {
            this.outputLog.innerText += `${fileName} ${error.message}\n`;
            this.output(this.outputLog.innerText);
        }
    }
}
class Compiler {
    static compile(tokens, index, env) {
        const token = tokens[index];
        if (token.error)
            return { status: 1 /* Status.Fail */, message: `${token.value} ${token.error}` };
        if (token.word === ':')
            return { status: 1 /* Status.Fail */, message: 'Nested definition' };
        if (token.word === ';') {
            Dictionary.colonDef[env.tempDef.name] = {
                name: env.tempDef.name,
                tokens: env.tempDef.tokens.slice()
            };
            // Store ColonDef in memory
            env.memory.create(env.tempDef.name);
            const addrSemantics = env.memory.here() - 8;
            env.memory.storeCell(addrSemantics, RunTimeSemantics.ColonDef);
            env.memory.allot(8); // Spare :)
            env.tempDef = { name: '', tokens: [] };
            env.runMode = RunMode.Interpret;
            return { status: 0 /* Status.Ok */, message: '' };
        }
        switch (token.kind) {
            case TokenKind.ColonDef:
            case TokenKind.Character:
            case TokenKind.Constant:
            case TokenKind.Create:
            case TokenKind.Value:
            case TokenKind.Variable:
                return { status: 1 /* Status.Fail */, message: `${token.value} No Compilation` };
            case TokenKind.DotParen:
                env.outputBuffer += token.content;
                break;
            case TokenKind.CQuote: {
                Dictionary.words[token.word](env, token);
                const cAddr = env.dStack.pop();
                env.tempDef.tokens.push(Compiler.makeNumberToken(cAddr));
                break;
            }
            case TokenKind.SQuote: {
                Dictionary.words[token.word](env, token);
                const length = env.dStack.pop();
                const cAddr = env.dStack.pop();
                env.tempDef.tokens.push(Compiler.makeNumberToken(cAddr));
                env.tempDef.tokens.push(Compiler.makeNumberToken(length));
                break;
            }
            case TokenKind.Number: {
                env.tempDef.tokens.push(Compiler.makeNumberToken(token.number));
                break;
            }
            case TokenKind.Tick: {
                const res = Dictionary.words['\''](env, token);
                if (res.status === 1 /* Status.Fail */)
                    return res;
                const addrSemantics = env.dStack.pop();
                env.tempDef.tokens.push(Compiler.makeNumberToken(addrSemantics));
                break;
            }
            case TokenKind.Word: {
                if (token.word === 'BL') {
                    env.tempDef.tokens.push(Compiler.makeNumberToken(32));
                    break;
                }
                if (Dictionary.words.hasOwnProperty(token.word) ||
                    Dictionary.colonDef.hasOwnProperty(token.word)) {
                    env.tempDef.tokens.push(token);
                    break;
                }
                const defAddr = env.memory.findName(token.word);
                if (defAddr > 0) {
                    const value = env.memory.execDefinition(defAddr);
                    env.tempDef.tokens.push(Compiler.makeNumberToken(value));
                    break;
                }
                return { status: 1 /* Status.Fail */, message: `${token.value} ?` };
            }
            default:
                env.tempDef.tokens.push(token);
        }
        return { status: 0 /* Status.Ok */, message: '' };
    }
    static makeNumberToken(number) {
        return { content: '', error: '', kind: TokenKind.Number, value: '', word: '', number };
    }
}
var Status;
(function (Status) {
    Status[Status["Ok"] = 0] = "Ok";
    Status[Status["Fail"] = 1] = "Fail";
})(Status || (Status = {}));
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Backslash"] = 0] = "Backslash";
    TokenKind[TokenKind["BracketChar"] = 1] = "BracketChar";
    TokenKind[TokenKind["CQuote"] = 2] = "CQuote";
    TokenKind[TokenKind["Character"] = 3] = "Character";
    TokenKind[TokenKind["ColonDef"] = 4] = "ColonDef";
    TokenKind[TokenKind["Constant"] = 5] = "Constant";
    TokenKind[TokenKind["Create"] = 6] = "Create";
    TokenKind[TokenKind["DotParen"] = 7] = "DotParen";
    TokenKind[TokenKind["DotQuote"] = 8] = "DotQuote";
    TokenKind[TokenKind["Number"] = 9] = "Number";
    TokenKind[TokenKind["Paren"] = 10] = "Paren";
    TokenKind[TokenKind["SQuote"] = 11] = "SQuote";
    TokenKind[TokenKind["Tick"] = 12] = "Tick";
    TokenKind[TokenKind["Value"] = 13] = "Value";
    TokenKind[TokenKind["ValueTo"] = 14] = "ValueTo";
    TokenKind[TokenKind["Variable"] = 15] = "Variable";
    TokenKind[TokenKind["Word"] = 16] = "Word";
})(TokenKind || (TokenKind = {}));
var RunMode;
(function (RunMode) {
    RunMode[RunMode["Interpret"] = 0] = "Interpret";
    RunMode[RunMode["Compile"] = 1] = "Compile";
    RunMode[RunMode["Run"] = 2] = "Run";
})(RunMode || (RunMode = {}));
var RunTimeSemantics;
(function (RunTimeSemantics) {
    RunTimeSemantics[RunTimeSemantics["BuiltInWord"] = 0] = "BuiltInWord";
    RunTimeSemantics[RunTimeSemantics["ColonDef"] = 1] = "ColonDef";
    RunTimeSemantics[RunTimeSemantics["Constant"] = 2] = "Constant";
    RunTimeSemantics[RunTimeSemantics["DataAddress"] = 3] = "DataAddress";
    RunTimeSemantics[RunTimeSemantics["Value"] = 4] = "Value";
    RunTimeSemantics[RunTimeSemantics["Variable"] = 5] = "Variable";
})(RunTimeSemantics || (RunTimeSemantics = {}));
class Dictionary {
}
Dictionary.colonDef = {};
Dictionary.words = {
    'BASE': (env) => {
        // ( -- a-addr )
        // a-addr is the address of a cell containing the current number-conversion radix {{2...36}}.
        env.dStack.push(env.memory.base());
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'HEX': (env) => {
        // ( -- )
        // Set contents of BASE to sixteen.
        env.memory.storeCell(env.memory.base(), 16);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'DECIMAL': (env) => {
        // ( -- )
        // Set the numeric conversion radix to ten (decimal).
        env.memory.storeCell(env.memory.base(), 10);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // Definition
    ':': (env) => {
        // ( C: "<spaces>name" -- colon-sys )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: ';  No Interpretation' };
        return { status: 0 /* Status.Ok */, message: '' };
    },
    ';': (env) => {
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: ';  No Interpretation' };
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // Comments
    '(': () => {
        // ( "ccc<paren>" -- )
        // Discard comment
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '.(': (env, token) => {
        // ( "ccc<paren>" -- )
        // Print comment on Interpretation and Compilation mode
        if (env.runMode === RunMode.Interpret ||
            env.runMode === RunMode.Compile)
            env.outputBuffer += token.content;
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '\\': () => {
        // ( "ccc<eol>" -- )
        // Discard comment
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // Char
    'BL': (env) => {
        // Put the ASCII code of space in Stack
        env.dStack.push(32);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'CHAR': (env, token) => {
        // ( "<spaces>name" -- char )
        env.dStack.push(token.content.charCodeAt(0));
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '[CHAR]': (env, token) => {
        // (C: "<spaces>name" -- ) ( -- char )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: '[CHAR] No Interpretation' };
        env.dStack.push(token.content.charCodeAt(0));
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'C@': (env) => {
        // ( c-addr -- char )
        const cAddr = env.dStack.pop();
        const char = env.memory.fetchChar(cAddr);
        env.dStack.push(char);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'C!': (env) => {
        // ( char c-addr -- )
        const cAddr = env.dStack.pop();
        const char = env.dStack.pop();
        env.memory.storeChar(cAddr, char);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // String
    '."': (env, token) => {
        env.outputBuffer += token.content;
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'C"': (env, token) => {
        Dictionary.words['S"'](env, token);
        env.dStack.pop(); // Drops the string length
        const cAddr = env.dStack.pop(); // Address of the first character
        env.dStack.push(cAddr - 1); // Address of the leading count byte
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'S"': (env, token) => {
        const text = token.content;
        const len = text.length;
        env.memory.create('');
        const lenAddr = env.memory.here();
        env.memory.allot(len + 1);
        env.memory.storeChar(lenAddr, len);
        const addr = lenAddr + 1;
        env.dStack.push(addr);
        env.dStack.push(text.length);
        for (let i = 0; i < len; i += 1)
            env.memory.storeChar(addr + i, text.charCodeAt(i));
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'COUNT': (env) => {
        // ( c-addr1 -- c-addr2 u )
        // c-addr1 - address of a leading count byte
        // c-addr2 - address of the first char
        // u - string length
        const cAddr1 = env.dStack.pop();
        const len = env.memory.fetchChar(cAddr1);
        env.dStack.push(cAddr1 + 1);
        env.dStack.push(len);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'TYPE': (env) => {
        // ( c-addr u -- )
        const len = env.dStack.pop();
        const cAddr = env.dStack.pop();
        const chars = Array(len);
        for (let i = 0; i < len; i += 1)
            chars[i] = String.fromCharCode(env.memory.fetchChar(cAddr + i));
        env.outputBuffer += chars.join('');
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // Output
    'CR': (env) => {
        env.outputBuffer += '\n';
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'EMIT': (env) => {
        const charCode = env.dStack.pop();
        const character = String.fromCharCode(charCode);
        env.outputBuffer += character;
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'SPACE': (env) => {
        env.outputBuffer += ' ';
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'SPACES': (env) => {
        const count = env.dStack.pop();
        env.outputBuffer += ' '.repeat(count);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // Numbers
    '+': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 + n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '-': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 - n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '*': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 * n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '/': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 / n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'ABS': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(Math.abs(n1));
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'MOD': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 % n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'MAX': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(Math.max(n1, n2));
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'MIN': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(Math.min(n1, n2));
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'NEGATE': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(-n1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'INVERT': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(~n1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '1+': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(n1 + 1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '1-': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(n1 - 1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '2*': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(n1 << 1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '2/': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(n1 >> 1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // Stack manipulation
    '.': (env) => {
        const n = env.dStack.pop();
        const radix = env.memory.fetchCell(env.memory.base());
        const text = Number.isInteger(n) ? n.toString(radix).toUpperCase() : String(n);
        env.outputBuffer += text + ' ';
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'DEPTH': (env) => {
        env.dStack.push(env.dStack.depth());
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'DUP': (env) => {
        env.dStack.push(env.dStack.pick(0));
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'OVER': (env) => {
        env.dStack.push(env.dStack.pick(1));
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'DROP': (env) => {
        env.dStack.pop();
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'SWAP': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n2);
        env.dStack.push(n1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'ROT': (env) => {
        const n3 = env.dStack.pop();
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n2);
        env.dStack.push(n3);
        env.dStack.push(n1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '?DUP': (env) => {
        const n = env.dStack.pick(0);
        if (n !== 0)
            env.dStack.push(env.dStack.pick(0));
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'NIP': (env) => {
        // ( x1 x2 -- x2 )
        const n2 = env.dStack.pop();
        env.dStack.pop(); // n1
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'TUCK': (env) => {
        // ( x1 x2 -- x2 x1 x2 )
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n2);
        env.dStack.push(n1);
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '2DROP': (env) => {
        // ( x1 x2 -- )
        env.dStack.pop();
        env.dStack.pop();
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '2DUP': (env) => {
        // ( x1 x2 -- x1 x2 x1 x2 )
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1);
        env.dStack.push(n2);
        env.dStack.push(n1);
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '2SWAP': (env) => {
        // ( x1 x2 x3 x4 -- x3 x4 x1 x2 )
        const n4 = env.dStack.pop();
        const n3 = env.dStack.pop();
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n3);
        env.dStack.push(n4);
        env.dStack.push(n1);
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '2OVER': (env) => {
        // ( x1 x2 x3 x4 -- x1 x2 x3 x4 x1 x2 )
        const n4 = env.dStack.pop();
        const n3 = env.dStack.pop();
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1);
        env.dStack.push(n2);
        env.dStack.push(n3);
        env.dStack.push(n4);
        env.dStack.push(n1);
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // Return stack
    '>R': (env) => {
        // ( x -- ) ( R: -- x )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: '>R  No Interpretation' };
        const n1 = env.dStack.pop();
        env.rStack.push(n1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'R@': (env) => {
        // ( -- x ) ( R: x -- x )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: 'R@  No Interpretation' };
        const n1 = env.rStack.pick(0);
        env.dStack.push(n1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'R>': (env) => {
        // ( -- x ) ( R: x -- )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: 'R>  No Interpretation' };
        const n1 = env.rStack.pop();
        env.dStack.push(n1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '2>R': (env) => {
        // ( x1 x2 -- ) ( R: -- x1 x2 )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: '2>R  No Interpretation' };
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.rStack.push(n1);
        env.rStack.push(n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '2R@': (env) => {
        // ( -- x1 x2 ) ( R: x1 x2 -- x1 x2 )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: '2R@  No Interpretation' };
        const n2 = env.rStack.pick(1);
        const n1 = env.rStack.pick(0);
        env.dStack.push(n1);
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '2R>': (env) => {
        // ( -- x1 x2 ) ( R: x1 x2 -- )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: '2R>  No Interpretation' };
        const n2 = env.rStack.pop();
        const n1 = env.rStack.pop();
        env.dStack.push(n1);
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // Memory
    'ALIGN': (env) => {
        // ( -- )
        env.memory.align();
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'HERE': (env) => {
        const addr = env.memory.here();
        env.dStack.push(addr);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'CREATE': (env, token) => {
        // ( "<spaces>name" -- )
        env.memory.create(token.content.toUpperCase());
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'ALLOT': (env) => {
        // ( n -- )
        const n = env.dStack.pop();
        env.memory.allot(n);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'VARIABLE': (env, token) => {
        // ( "<spaces>name" -- )
        Dictionary.words['CREATE'](env, token);
        const addr = env.memory.here();
        env.memory.allot(8);
        env.memory.storeCell(addr, 0);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '!': (env) => {
        // ( x a-addr -- )
        const addr = env.dStack.pop();
        const n = env.dStack.pop();
        env.memory.storeCell(addr, n);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '@': (env) => {
        // ( a-addr -- x )
        const addr = env.dStack.pop();
        const n = env.memory.fetchCell(addr);
        env.dStack.push(n);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    ',': (env) => {
        // ( x -- )
        const addr = env.memory.here();
        env.memory.allot(8);
        const n = env.dStack.pop();
        env.memory.storeCell(addr, n);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'C,': (env) => {
        // ( char  -- )
        const addr = env.memory.here();
        env.memory.allot(1);
        const n = env.dStack.pop();
        env.memory.storeChar(addr, n);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'ALIGNED': (env) => {
        // ( addr -- a-addr )
        const addr = env.dStack.pop();
        const remainder = addr % 8;
        const aligned = remainder === 0 ? addr : addr + 8 - remainder;
        env.dStack.push(aligned);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'CHARS': (env) => {
        // ( n1 -- n2 )
        const n1 = env.dStack.pop();
        env.dStack.push(n1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'CHAR+': (env) => {
        // ( c-addr1 -- c-addr2 )
        const addr1 = env.dStack.pop();
        env.dStack.push(addr1 + 1);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'CELLS': (env) => {
        // ( n1 -- n2 )
        const n1 = env.dStack.pop();
        env.dStack.push(n1 << 3);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'CELL+': (env) => {
        // ( a-addr1 -- a-addr2 )
        const addr1 = env.dStack.pop();
        env.dStack.push(addr1 + 8);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '\'': (env, token) => {
        // ( "<spaces>name" -- xt )
        const addr = env.memory.findName(token.content.toUpperCase());
        if (addr === 0)
            return { status: 1 /* Status.Fail */, message: `${token.value} ?` };
        const addrSemantics = addr + 40;
        env.dStack.push(addrSemantics);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'EXECUTE': (env) => {
        // ( i * x xt -- j * x )
        // Remove xt from the stack and perform the semantics identified by it.
        const addrSemantics = env.dStack.pop();
        const semantics = env.memory.fetchCell(addrSemantics);
        switch (semantics) {
            case RunTimeSemantics.BuiltInWord:
            case RunTimeSemantics.ColonDef:
                const nameLength = env.memory.fetchChar(addrSemantics - 40);
                const chars = Array(nameLength);
                const cAddr = addrSemantics - 40 + 1;
                for (let i = 0; i < nameLength; i += 1)
                    chars[i] = String.fromCharCode(env.memory.fetchChar(cAddr + i));
                const word = chars.join('');
                if (semantics === RunTimeSemantics.BuiltInWord && Dictionary.words.hasOwnProperty(word))
                    return Dictionary.words[word](env, { kind: TokenKind.Word, error: '', content: '', value: word, word, number: 0 });
                if (semantics === RunTimeSemantics.ColonDef && Dictionary.colonDef.hasOwnProperty(word))
                    return Executor.run(Dictionary.colonDef[word].tokens, env);
                return { status: 1 /* Status.Fail */, message: `${word} ?` };
            case RunTimeSemantics.DataAddress:
            case RunTimeSemantics.Variable:
                env.dStack.push(addrSemantics + 8);
                break;
            case RunTimeSemantics.Value:
            case RunTimeSemantics.Constant:
                const value = env.memory.fetchCell(addrSemantics + 8);
                env.dStack.push(value);
                break;
            default:
                throw new Error('EXECUTE Unreachable');
        }
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // Values
    'VALUE': (env, token) => {
        // ( x "<spaces>name" -- )
        const n = env.dStack.pop();
        Dictionary.words['VARIABLE'](env, token);
        const addr = env.memory.here() - 8;
        env.memory.storeCell(addr, n);
        env.memory.storeCell(addr - 8, RunTimeSemantics.Value);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'TO': (env, token) => {
        // ( x "<spaces>name" -- )
        const word = token.content.toUpperCase();
        const addr = env.memory.findName(word);
        const rtb = env.memory.fetchCell(addr + 40);
        if (rtb !== RunTimeSemantics.Value)
            return { status: 1 /* Status.Fail */, message: `${token.content} Not a VALUE` };
        const n = env.dStack.pop();
        env.memory.storeCell(addr + 48, n);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // Constant
    'CONSTANT': (env, token) => {
        // ( x "<spaces>name" -- )
        const n = env.dStack.pop();
        Dictionary.words['VARIABLE'](env, token);
        const addr = env.memory.here() - 8;
        env.memory.storeCell(addr, n);
        env.memory.storeCell(addr - 8, RunTimeSemantics.Constant);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // Comparison
    '=': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 === n2 ? -1 : 0);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '<>': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 !== n2 ? -1 : 0);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '>': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 > n2 ? -1 : 0);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '<': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 < n2 ? -1 : 0);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '0=': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(n1 === 0 ? -1 : 0);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '0>': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(n1 > 0 ? -1 : 0);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '0<': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(n1 < 0 ? -1 : 0);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    '0<>': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(n1 !== 0 ? -1 : 0);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'AND': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 === n2 ? n1 : Math.abs(n1) === Math.abs(n2) ? Math.abs(n1) : 0);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'OR': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 || n2);
        return { status: 0 /* Status.Ok */, message: '' };
    },
    // BEGIN
    'BEGIN': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, message: 'BEGIN No Interpretation' }
            : { status: 0 /* Status.Ok */, message: '' };
    },
    'WHILE': () => {
        return { status: 1 /* Status.Fail */, message: 'WHILE Not expected' };
    },
    'UNTIL': () => {
        return { status: 1 /* Status.Fail */, message: 'UNTIL Not expected' };
    },
    'REPEAT': () => {
        return { status: 1 /* Status.Fail */, message: 'UNTIL Not expected' };
    },
    // DO
    'DO': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, message: 'DO No Interpretation' }
            : { status: 0 /* Status.Ok */, message: '' };
    },
    '?DO': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, message: '?DO No Interpretation' }
            : { status: 0 /* Status.Ok */, message: '' };
    },
    'I': (env) => {
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: 'I No Interpretation' };
        env.dStack.push(env.rStack.pick(0));
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'J': (env) => {
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: 'J No Interpretation' };
        env.dStack.push(env.rStack.pick(1));
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'LEAVE': (env) => {
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, message: 'LEAVE No Interpretation' };
        env.isLeave = true;
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'LOOP': () => {
        return { status: 1 /* Status.Fail */, message: 'LOOP Not expected' };
    },
    '+LOOP': () => {
        return { status: 1 /* Status.Fail */, message: '+LOOP Not expected' };
    },
    // IF
    'IF': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, message: 'IF No Interpretation' }
            : { status: 0 /* Status.Ok */, message: '' };
    },
    'ELSE': () => {
        return { status: 1 /* Status.Fail */, message: 'ELSE Not expected' };
    },
    'THEN': () => {
        return { status: 1 /* Status.Fail */, message: 'THEN Not expected' };
    },
    // Tools
    '.S': (env) => {
        const radix = env.memory.fetchCell(env.memory.base());
        env.outputBuffer += env.dStack.print()
            .map((n) => Number.isInteger(n) ? n.toString(radix).toUpperCase() : String(n))
            .join(' ') + ' <- Top';
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'WORDS': (env) => {
        const words = [
            ...Object.keys(Dictionary.colonDef),
            ...Object.keys(Dictionary.words),
        ].sort();
        const output = [];
        for (let i = 0; i < words.length; i++) {
            if (i % 8 === 0)
                output.push('\n');
            output.push(words[i].slice(0, 9).padEnd(10, ' '));
        }
        env.outputBuffer += output.join('') + '\n';
        return { status: 0 /* Status.Ok */, message: '' };
    },
    'PAGE': (env) => {
        env.outputBuffer = '';
        return { status: 0 /* Status.Ok */, message: '' };
    },
};
class Executor {
    static run(tokens, env) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.error)
                return { status: 1 /* Status.Fail */, message: ` ${token.value} ${token.error}` };
            switch (token.kind) {
                case TokenKind.Number:
                    env.dStack.push(token.number);
                    break;
                default:
                    if (env.isLeave)
                        break;
                    if (token.word === 'IF') {
                        const res = Executor.runIF(tokens, i, env);
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, message: res.message };
                        if (typeof res.newIndex === 'number')
                            i = res.newIndex;
                        break;
                    }
                    if (token.word === 'DO' || token.word === '?DO') {
                        const res = Executor.runDO(tokens, i, env);
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, message: res.message };
                        if (typeof res.newIndex === 'number')
                            i = res.newIndex;
                        break;
                    }
                    if (token.word === 'BEGIN') {
                        const res = Executor.runBEGIN(tokens, i, env);
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, message: res.message };
                        if (typeof res.newIndex === 'number')
                            i = res.newIndex;
                        break;
                    }
                    if (Dictionary.colonDef.hasOwnProperty(token.word)) {
                        const res = Executor.run(Dictionary.colonDef[token.word].tokens, env);
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, message: res.message };
                        break;
                    }
                    if (Dictionary.words.hasOwnProperty(token.word)) {
                        const res = Dictionary.words[token.word](env, token);
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, message: res.message };
                        if (env.isLeave)
                            return { status: 0 /* Status.Ok */, message: '' };
                        break;
                    }
                    return { status: 1 /* Status.Fail */, message: `${token.value} ? (Execute)` };
            }
        }
        return { status: 0 /* Status.Ok */, message: '' };
    }
    static runIF(tokens, index, env) {
        // Find THEN index
        let thenIndex = index + 1;
        let ifDepth = 1;
        while (true) {
            thenIndex += 1;
            if (thenIndex === tokens.length)
                return { status: 1 /* Status.Fail */, message: 'THEN Is missing' };
            const loopWord = tokens[thenIndex].value.toUpperCase();
            if (loopWord === 'IF')
                ifDepth += 1;
            if (loopWord === 'THEN')
                ifDepth -= 1;
            if (ifDepth === 0)
                break;
        }
        // Find ELSE index
        let elseIndex = index + 1;
        ifDepth = 1;
        while (elseIndex < thenIndex) {
            elseIndex += 1;
            const loopWord = tokens[elseIndex].value.toUpperCase();
            if (loopWord === 'IF')
                ifDepth += 1;
            if (loopWord === 'THEN')
                ifDepth -= 1;
            if (ifDepth === 1 && loopWord === 'ELSE')
                break;
        }
        const flag = env.dStack.pop();
        if (flag) {
            // Consequent part
            const consTokens = tokens.slice(index + 1, elseIndex);
            const res = Executor.run(consTokens, env);
            return { status: res.status, message: res.message, newIndex: thenIndex };
        }
        if (elseIndex < thenIndex) {
            // Alternative part
            const altTokens = tokens.slice(elseIndex + 1, thenIndex);
            const res = Executor.run(altTokens, env);
            return { status: res.status, message: res.message, newIndex: thenIndex };
        }
        // Continuation
        return { status: 0 /* Status.Ok */, message: '', newIndex: thenIndex };
    }
    static runDO(tokens, index, env) {
        // Find LOOP index
        let loopIndex = index + 1;
        let doDepth = 1;
        while (true) {
            loopIndex += 1;
            if (loopIndex === tokens.length)
                return { status: 1 /* Status.Fail */, message: 'LOOP Not found' };
            const word = tokens[loopIndex].word;
            if (word === 'DO')
                doDepth += 1;
            if (word === 'LOOP' || word === '+LOOP')
                doDepth -= 1;
            if (doDepth === 0)
                break;
        }
        let counter = env.dStack.pop();
        const limit = env.dStack.pop();
        const upwards = limit > counter;
        if (tokens[index].word === '?DO' && counter === limit) {
            // No entry in the loop
            env.isLeave = false;
            return { status: 0 /* Status.Ok */, message: '', newIndex: loopIndex };
        }
        const isPlusLoop = tokens[loopIndex].word === '+LOOP';
        if (!isPlusLoop && !upwards)
            return { status: 1 /* Status.Fail */, message: 'LOOP Wrong range' };
        const doBody = tokens.slice(index + 1, loopIndex);
        while (upwards ? counter < limit : counter >= limit) {
            env.rStack.push(counter);
            const res = Executor.run(doBody, env);
            env.rStack.pop();
            if (env.isLeave)
                break;
            if (res.status === 1 /* Status.Fail */)
                return { status: 1 /* Status.Fail */, message: res.message };
            counter += isPlusLoop ? env.dStack.pop() : 1;
        }
        // Continuation
        env.isLeave = false;
        return { status: 0 /* Status.Ok */, message: '', newIndex: loopIndex };
    }
    static runBEGIN(tokens, index, env) {
        // Find WHILE, REPEAT, or UNTIL index
        let whileIndex = 0, repeatIndex = 0, untilIndex = 0;
        let i = index + 1;
        while (i < tokens.length) {
            const word = tokens[i].word;
            if (word === 'WHILE')
                whileIndex = i;
            else if (word === 'UNTIL')
                untilIndex = i;
            else if (word === 'REPEAT')
                repeatIndex = i;
            i += 1;
        }
        if (repeatIndex === 0 && whileIndex > 0)
            return { status: 1 /* Status.Fail */, message: 'WHILE Not found' };
        if (repeatIndex === 0 && untilIndex === 0)
            return { status: 1 /* Status.Fail */, message: 'BEGIN Not closed' };
        if (repeatIndex > 0 && untilIndex > 0)
            return { status: 1 /* Status.Fail */, message: 'BEGIN Control flow mismatched' };
        if (untilIndex > 0 && whileIndex > 0)
            return { status: 1 /* Status.Fail */, message: 'BEGIN Control flow mismatched' };
        // BEGIN <init-code> <flag> WHILE <body-code> REPEAT
        if (whileIndex > 0) {
            const initCode = tokens.slice(index + 1, whileIndex);
            const bodyCode = tokens.slice(whileIndex + 1, repeatIndex);
            while (true) {
                const initRes = Executor.run(initCode, env);
                if (initRes.status === 1 /* Status.Fail */)
                    return { status: 1 /* Status.Fail */, message: initRes.message };
                const flag = env.dStack.pop();
                if (flag === 0)
                    break;
                const bodyRes = Executor.run(bodyCode, env);
                if (bodyRes.status === 1 /* Status.Fail */)
                    return { status: 1 /* Status.Fail */, message: bodyRes.message };
            }
            // Continuation
            return { status: 0 /* Status.Ok */, message: '', newIndex: repeatIndex };
        }
        // BEGIN <body-code> <flag> UNTIL
        if (untilIndex > 0) {
            const bodyCode = tokens.slice(index + 1, untilIndex);
            while (true) {
                const bodyRes = Executor.run(bodyCode, env);
                if (bodyRes.status === 1 /* Status.Fail */)
                    return { status: 1 /* Status.Fail */, message: bodyRes.message };
                const flag = env.dStack.pop();
                if (flag !== 0)
                    break;
            }
            // Continuation
            return { status: 0 /* Status.Ok */, message: '', newIndex: untilIndex };
        }
        throw new Error('Unreachable');
    }
}
class Forth {
    constructor(output) {
        this.MEMORY_CAPACITY = 1000000;
        this.STACK_CAPACITY = 1024;
        this.output = output;
        this.env = {
            inputBuffer: '',
            outputBuffer: '',
            runMode: RunMode.Interpret,
            isLeave: false,
            dStack: new Stack(this.STACK_CAPACITY),
            rStack: new Stack(this.STACK_CAPACITY),
            memory: new Memory(this.MEMORY_CAPACITY),
            tempDef: { name: '', tokens: [] },
        };
    }
    interpret(inputLine) {
        this.env.inputBuffer = inputLine + ' ';
        this.env.outputBuffer += this.env.inputBuffer;
        try {
            const radix = this.env.memory.fetchCell(this.env.memory.base());
            const tokens = Parser.parseLine(this.env.inputBuffer, radix);
            for (let i = 0; i < tokens.length; i += 1) {
                const token = tokens[i];
                if (token.error) {
                    this.die(`${token.value} ${token.error}`);
                    return;
                }
                if (this.env.runMode === RunMode.Run) {
                    this.die(token.value + ' Forth: Run mode not allowed here');
                    return;
                }
                const res = this.env.runMode === RunMode.Interpret
                    ? Interpreter.run(tokens, i, this.env)
                    : Compiler.compile(tokens, i, this.env);
                if (res.status === 1 /* Status.Fail */) {
                    this.die(res.message);
                    return;
                }
            }
        }
        catch (e) {
            this.die(e.message);
            return;
        }
        if (this.env.runMode === RunMode.Interpret)
            this.env.outputBuffer += ' ok';
        this.env.outputBuffer += '\n';
        this.output(this.env.outputBuffer);
    }
    printStack() {
        const radix = this.env.memory.fetchCell(this.env.memory.base());
        return this.env.dStack.print()
            .map((n) => Number.isInteger(n) ? n.toString(radix).toUpperCase() : String(n))
            .join(' ') + ' <- Top';
    }
    die(message) {
        this.env.dStack.clear();
        this.env.rStack.clear();
        this.env.runMode = RunMode.Interpret;
        this.env.isLeave = false;
        this.env.outputBuffer += message + '\n';
        this.output(this.env.outputBuffer);
    }
}
class Interpreter {
    static run(tokens, index, env) {
        const token = tokens[index];
        if (token.error)
            return { status: 1 /* Status.Fail */, message: `${token.value} ${token.error}` };
        switch (token.kind) {
            case TokenKind.Number:
                env.dStack.push(token.number);
                break;
            case TokenKind.ColonDef:
                env.tempDef = { name: token.content.toUpperCase(), tokens: [] };
                env.runMode = RunMode.Compile;
                break;
            default:
                if (Dictionary.colonDef.hasOwnProperty(token.word)) {
                    env.runMode = RunMode.Run;
                    const res = Executor.run(Dictionary.colonDef[token.word].tokens, env);
                    env.runMode = RunMode.Interpret;
                    return res;
                }
                if (Dictionary.words.hasOwnProperty(token.word))
                    return Dictionary.words[token.word](env, token);
                const defAddr = env.memory.findName(token.word);
                if (defAddr > 0) {
                    const value = env.memory.execDefinition(defAddr);
                    env.dStack.push(value);
                    break;
                }
                return { status: 1 /* Status.Fail */, message: `${token.value} ?` };
        }
        return { status: 0 /* Status.Ok */, message: '' };
    }
}
class Memory {
    constructor(capacity) {
        /*
            Definition
            0000 - 0000 : 1 byte - name length
            0001 - 0031 : name in characters
            0032 - 0039 : link to previous definition ( to the length byte )
            0040 - 0047 : Run-time semantics
            0048 - ...  : data bytes
         */
        this.NAME_LEN = 31; // ASCII characters
        this.BASE_ADDR = 8;
        this.capacity = capacity;
        this.memory = new ArrayBuffer(capacity);
        this.uint8Arr = new Uint8Array(this.memory);
        this.float64Arr = new Float64Array(this.memory);
        this.SD = 80;
        this.lastDef = -1;
        // Decimal mode
        this.float64Arr[this.BASE_ADDR] = 10;
        for (const word of Object.keys(Dictionary.words)) {
            this.create(word);
            const addrSemantics = this.SD - 8;
            this.float64Arr[addrSemantics] = RunTimeSemantics.BuiltInWord;
            this.allot(8); // Spare
        }
    }
    align() {
        const remainder = this.SD % 8;
        if (remainder > 0) {
            const aligned = this.SD + 8 - remainder;
            this.uint8Arr.fill(0, this.SD, aligned);
            this.SD = aligned;
        }
    }
    here() {
        return this.SD;
    }
    base() {
        return this.BASE_ADDR;
    }
    allot(sizeBytes) {
        if (this.SD + sizeBytes >= this.capacity)
            throw new Error('Memory Overflow');
        this.uint8Arr.fill(0, this.SD, this.SD + sizeBytes);
        this.SD += sizeBytes;
    }
    create(defName) {
        this.align();
        const defAddr = this.SD;
        // Set length byte
        const nameLength = Math.min(defName.length, this.NAME_LEN);
        this.uint8Arr[defAddr] = nameLength;
        // Fill name
        for (let i = 0; i < nameLength; i += 1)
            this.uint8Arr[defAddr + i + 1] = defName.charCodeAt(i);
        this.uint8Arr.fill(0, defAddr + nameLength + 1, defAddr + this.NAME_LEN);
        // Set link to prev def
        this.float64Arr[defAddr + 32] = this.lastDef;
        // Set Run-time behaviour
        this.float64Arr[defAddr + 40] = RunTimeSemantics.DataAddress;
        this.lastDef = this.SD;
        this.SD = defAddr + 48;
    }
    findName(defName) {
        let addr = this.lastDef;
        while (addr > 0) {
            // Compare names length
            if (this.uint8Arr[addr] === defName.length) {
                let found = true;
                // Compare names characters
                for (let i = 0; i < defName.length; i += 1) {
                    if (this.uint8Arr[addr + 1 + i] !== defName.charCodeAt(i)) {
                        found = false;
                        break;
                    }
                }
                // Names match. Return address.
                if (found)
                    return addr;
            }
            addr = this.float64Arr[addr + 32]; // Previous def
        }
        return addr;
    }
    execDefinition(addr) {
        switch (this.float64Arr[addr + 40]) {
            case RunTimeSemantics.ColonDef:
            case RunTimeSemantics.BuiltInWord:
                return addr + 40; // Addr of run-time semantics
            case RunTimeSemantics.DataAddress:
                return addr + 48; // Addr of first data cell
            case RunTimeSemantics.Value:
            case RunTimeSemantics.Constant:
                return this.float64Arr[addr + 48]; // Value of first data cell
        }
        throw new Error('Memory Find Unreachable');
    }
    fetchChar(addr) {
        if (addr < 0 || addr >= this.capacity)
            throw new Error('Out of Range');
        return this.uint8Arr[addr];
    }
    storeChar(addr, char) {
        if (addr < 0 || addr >= this.capacity)
            throw new Error('Out of Range');
        this.uint8Arr[addr] = char;
    }
    fetchCell(addr) {
        if (addr < 0 || addr >= this.capacity)
            throw new Error('Out of Range');
        if (addr % 8 !== 0)
            throw new Error('Address in not aligned');
        return this.float64Arr[addr];
    }
    storeCell(addr, n) {
        if (addr < 0 || addr >= this.capacity)
            throw new Error('Out of Range');
        if (addr % 8 !== 0)
            throw new Error('Address in not aligned');
        this.float64Arr[addr] = n;
    }
}
class Parser {
    static parseLine(inputLine, radix) {
        const tokens = [];
        const codeLine = inputLine.trimStart();
        let index = 0;
        while (index < codeLine.length) {
            if (codeLine[index] === ' ') {
                index += 1;
                continue;
            }
            let toIndex = codeLine.indexOf(' ', index);
            if (toIndex === -1)
                throw new Error('Code line does not end with a space!');
            const value = codeLine.slice(index, toIndex);
            const word = value.toUpperCase();
            index = toIndex;
            // Words with content
            if (Parser.contentWords.hasOwnProperty(word)) {
                const grammar = Parser.contentWords[word];
                toIndex += 1;
                if (grammar.trimStart) {
                    while (codeLine[toIndex] === ' ')
                        toIndex += 1;
                }
                let endIndex = codeLine.indexOf(grammar.delimiter, toIndex + 1);
                index = endIndex + 1; // Eat the delimiter
                if (endIndex === -1) {
                    index = codeLine.length;
                    endIndex = codeLine.length;
                    if (grammar.strict) {
                        tokens.push({ kind: grammar.kind, error: 'Not Closed', content: '', value, word, number: 0 });
                        continue;
                    }
                }
                let content = codeLine.slice(toIndex, endIndex);
                if (!grammar.empty && content.length === 0) {
                    tokens.push({ kind: grammar.kind, error: 'Empty', content: '', value, word, number: 0 });
                    continue;
                }
                tokens.push({ kind: grammar.kind, error: '', content, value, word, number: 0 });
            }
            else {
                const isNumber = radix === 10
                    ? value.match(/^[+-]?\d+(?:.?\d+)?$/)
                    : value.match(/^[0-9A-Fa-f]{1,8}$/);
                if (isNumber) {
                    const number = radix === 10 ? Number(value) : parseInt(value, radix);
                    tokens.push({ kind: TokenKind.Number, error: '', content: '', value: '', word: '', number });
                }
                else {
                    tokens.push({ kind: TokenKind.Word, error: '', content: '', value, word, number: 0 });
                }
            }
        }
        return tokens;
    }
    static stringify(tokens) {
        return tokens.map((token) => {
            let value = token.value;
            if (Parser.contentWords.hasOwnProperty(token.word)) {
                const grammar = Parser.contentWords[token.word];
                value += ' ' + token.content;
                if (grammar.delimiter === '"' || grammar.delimiter === ')')
                    value += grammar.delimiter;
            }
            return value;
        }).join(' ');
    }
}
Parser.contentWords = {
    '\\': {
        kind: TokenKind.Backslash,
        delimiter: '\n',
        trimStart: false,
        strict: false,
        empty: true,
    },
    ':': {
        kind: TokenKind.ColonDef,
        delimiter: ' ',
        trimStart: true,
        strict: false,
        empty: false,
    },
    '(': {
        kind: TokenKind.Paren,
        delimiter: ')',
        trimStart: false,
        strict: true,
        empty: true,
    },
    '.(': {
        kind: TokenKind.DotParen,
        delimiter: ')',
        trimStart: false,
        strict: true,
        empty: true,
    },
    '."': {
        kind: TokenKind.DotQuote,
        delimiter: '"',
        trimStart: false,
        strict: true,
        empty: true,
    },
    'C"': {
        kind: TokenKind.CQuote,
        delimiter: '"',
        trimStart: false,
        strict: true,
        empty: true,
    },
    'S"': {
        kind: TokenKind.SQuote,
        delimiter: '"',
        trimStart: false,
        strict: true,
        empty: true,
    },
    '[CHAR]': {
        kind: TokenKind.BracketChar,
        delimiter: ' ',
        trimStart: true,
        strict: false,
        empty: false,
    },
    'CHAR': {
        kind: TokenKind.Character,
        delimiter: ' ',
        trimStart: true,
        strict: false,
        empty: false,
    },
    'CONSTANT': {
        kind: TokenKind.Constant,
        delimiter: ' ',
        trimStart: true,
        strict: false,
        empty: false,
    },
    'CREATE': {
        kind: TokenKind.Create,
        delimiter: ' ',
        trimStart: true,
        strict: false,
        empty: false,
    },
    'VALUE': {
        kind: TokenKind.Value,
        delimiter: ' ',
        trimStart: true,
        strict: false,
        empty: false,
    },
    'VARIABLE': {
        kind: TokenKind.Variable,
        delimiter: ' ',
        trimStart: true,
        strict: false,
        empty: false,
    },
    'TO': {
        kind: TokenKind.ValueTo,
        delimiter: ' ',
        trimStart: true,
        strict: false,
        empty: false,
    },
    '\'': {
        kind: TokenKind.Tick,
        delimiter: ' ',
        trimStart: true,
        strict: false,
        empty: false,
    },
};
module.exports = {
    Parser
};
class Stack {
    constructor(capacity) {
        this.holder = new Array(capacity);
        this.capacity = capacity;
        this.index = 0;
    }
    depth() {
        return this.index;
    }
    push(n) {
        if (this.index >= this.capacity)
            throw new Error('Stack overflow');
        this.holder[this.index] = n;
        this.index += 1;
    }
    pop() {
        if (this.index <= 0)
            throw new Error('Stack underflow');
        this.index -= 1;
        return this.holder[this.index];
    }
    pick(i) {
        const index = this.index - 1 - i;
        if (index < 0 || index >= this.index)
            throw new Error('Stack out of range');
        return this.holder[index];
    }
    clear() {
        this.index = 0;
    }
    print() {
        return this.holder.slice(0, this.index);
    }
}
//# sourceMappingURL=index.js.map