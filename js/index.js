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
        this.outputBuffer = "";
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
            this.compileCodeLine(cmdText, 0);
            return;
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
    trimText(text, maxLines) {
        return text.split('\n').slice(-maxLines).join('\n');
    }
    output(text) {
        this.outputBuffer = this.trimText(this.outputBuffer + text, this.OUT_BUFFER_LINES);
        this.outputLog.innerText = this.outputBuffer;
    }
    compileCodeLine(cmdText, lineNum) {
        if (cmdText !== '' && (this.inputBuffer.length === 0 ||
            this.inputBuffer[this.inputBuffer.length - 1] !== cmdText)) {
            this.inputBuffer.push(cmdText);
            this.inputIndex = this.inputBuffer.length - 1;
        }
        const tokens = Parser.parseLine(cmdText, lineNum);
        this.forth.run(tokens, cmdText);
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
            this.output(`${fileName}  File loaded\n`);
            const codeLines = event.target.result.split(/\r?\n/g);
            for (let i = 0; i < codeLines.length; i += 1)
                this.compileCodeLine(codeLines[i], i);
        }
        catch (error) {
            this.output(`${fileName} ${error.message}\n`);
        }
    }
}
class Compiler {
    static compile(tokens, index, env) {
        const token = tokens[index];
        if (token.error)
            return { status: 1 /* Status.Fail */, value: `${token.value} ${token.error}` };
        if (token.word === ':')
            return { status: 1 /* Status.Fail */, value: `: Nested definition` };
        if (token.word === ';') {
            Dictionary.colonDef[env.tempDef.name] = {
                name: env.tempDef.name,
                tokens: env.tempDef.tokens.slice()
            };
            env.tempDef = { name: '', tokens: [] };
            env.runMode = RunMode.Interpret;
            return { status: 0 /* Status.Ok */, value: '' };
        }
        if (token.kind === TokenKind.DotComment)
            return { status: 0 /* Status.Ok */, value: token.content };
        switch (token.kind) {
            case TokenKind.Comment:
            case TokenKind.LineComment:
                break;
            case TokenKind.Word:
                if (Dictionary.words.hasOwnProperty(token.word) ||
                    Dictionary.colonDef.hasOwnProperty(token.word) ||
                    env.value.hasOwnProperty(token.word) ||
                    env.constant.hasOwnProperty(token.word)) {
                    env.tempDef.tokens.push(token);
                    break;
                }
                return { status: 1 /* Status.Fail */, value: `${token.value} Unknown word` };
            default:
                env.tempDef.tokens.push(token);
        }
        return { status: 0 /* Status.Ok */, value: '' };
    }
}
var Status;
(function (Status) {
    Status[Status["Ok"] = 0] = "Ok";
    Status[Status["Fail"] = 1] = "Fail";
})(Status || (Status = {}));
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Character"] = 0] = "Character";
    TokenKind[TokenKind["ColonDef"] = 1] = "ColonDef";
    TokenKind[TokenKind["Comment"] = 2] = "Comment";
    TokenKind[TokenKind["Constant"] = 3] = "Constant";
    TokenKind[TokenKind["Create"] = 4] = "Create";
    TokenKind[TokenKind["DotComment"] = 5] = "DotComment";
    TokenKind[TokenKind["LineComment"] = 6] = "LineComment";
    TokenKind[TokenKind["Number"] = 7] = "Number";
    TokenKind[TokenKind["String"] = 8] = "String";
    TokenKind[TokenKind["Value"] = 9] = "Value";
    TokenKind[TokenKind["ValueTo"] = 10] = "ValueTo";
    TokenKind[TokenKind["Variable"] = 11] = "Variable";
    TokenKind[TokenKind["Word"] = 12] = "Word";
})(TokenKind || (TokenKind = {}));
var RunMode;
(function (RunMode) {
    RunMode[RunMode["Interpret"] = 0] = "Interpret";
    RunMode[RunMode["Compile"] = 1] = "Compile";
    RunMode[RunMode["Run"] = 2] = "Run";
})(RunMode || (RunMode = {}));
class Dictionary {
}
Dictionary.colonDef = {};
Dictionary.words = {
    // Comments
    '(': () => {
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '.(': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: '.( No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    '\\': () => {
        return { status: 0 /* Status.Ok */, value: '' };
    },
    // Char
    'BL': (env) => {
        // Put the ASCII code of space in Stack
        env.dStack.push(32);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'CHAR': () => {
        return { status: 0 /* Status.Ok */, value: '' };
    },
    // String
    '."': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: ' ."  No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    // Output
    'CR': () => {
        return { status: 0 /* Status.Ok */, value: '\n' };
    },
    'EMIT': (env) => {
        const charCode = env.dStack.pop();
        const char = String.fromCharCode(charCode);
        return { status: 0 /* Status.Ok */, value: char };
    },
    'SPACE': () => {
        return { status: 0 /* Status.Ok */, value: ' ' };
    },
    'SPACES': (env) => {
        const count = env.dStack.pop();
        return { status: 0 /* Status.Ok */, value: ' '.repeat(count) };
    },
    // Numbers
    '+': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 + n2);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '-': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 - n2);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '*': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 * n2);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '/': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 / n2);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'ABS': (env) => {
        const n1 = env.dStack.pop();
        env.dStack.push(Math.abs(n1));
        return { status: 0 /* Status.Ok */, value: '' };
    },
    // Stack manipulation
    '.': (env) => {
        return { status: 0 /* Status.Ok */, value: env.dStack.pop().toString() + ' ' };
    },
    'DEPTH': (env) => {
        env.dStack.push(env.dStack.depth());
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'DUP': (env) => {
        env.dStack.push(env.dStack.pick(0));
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'OVER': (env) => {
        env.dStack.push(env.dStack.pick(1));
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'DROP': (env) => {
        env.dStack.pop();
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'SWAP': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n2);
        env.dStack.push(n1);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'ROT': (env) => {
        const n3 = env.dStack.pop();
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n2);
        env.dStack.push(n3);
        env.dStack.push(n1);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '?DUP': (env) => {
        const n = env.dStack.pick(0);
        if (n !== 0)
            env.dStack.push(env.dStack.pick(0));
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'NIP': (env) => {
        // ( x1 x2 -- x2 )
        const n2 = env.dStack.pop();
        env.dStack.pop(); // n1
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'TUCK': (env) => {
        // ( x1 x2 -- x2 x1 x2 )
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n2);
        env.dStack.push(n1);
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '2DROP': (env) => {
        // ( x1 x2 -- )
        env.dStack.pop();
        env.dStack.pop();
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '2DUP': (env) => {
        // ( x1 x2 -- x1 x2 x1 x2 )
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1);
        env.dStack.push(n2);
        env.dStack.push(n1);
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, value: '' };
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
        return { status: 0 /* Status.Ok */, value: '' };
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
        return { status: 0 /* Status.Ok */, value: '' };
    },
    // Return stack
    '>R': (env) => {
        // ( x -- ) ( R: -- x )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: '>R  No Interpretation' };
        const n1 = env.dStack.pop();
        env.rStack.push(n1);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'R@': (env) => {
        // ( -- x ) ( R: x -- x )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: 'R@  No Interpretation' };
        const n1 = env.rStack.pick(0);
        env.dStack.push(n1);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'R>': (env) => {
        // ( -- x ) ( R: x -- )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: 'R>  No Interpretation' };
        const n1 = env.rStack.pop();
        env.dStack.push(n1);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '2>R': (env) => {
        // ( x1 x2 -- ) ( R: -- x1 x2 )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: '2>R  No Interpretation' };
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.rStack.push(n1);
        env.rStack.push(n2);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '2R@': (env) => {
        // ( -- x1 x2 ) ( R: x1 x2 -- x1 x2 )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: '2R@  No Interpretation' };
        const n2 = env.rStack.pick(1);
        const n1 = env.rStack.pick(0);
        env.dStack.push(n1);
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '2R>': (env) => {
        // ( -- x1 x2 ) ( R: x1 x2 -- )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: '2R>  No Interpretation' };
        const n2 = env.rStack.pop();
        const n1 = env.rStack.pop();
        env.dStack.push(n1);
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    // Values
    'VALUE': () => {
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'TO': () => {
        return { status: 0 /* Status.Ok */, value: '' };
    },
    // Constant
    'CONSTANT': () => {
        return { status: 0 /* Status.Ok */, value: '' };
    },
    // Comparison
    '=': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 === n2 ? -1 : 0);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '<>': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 !== n2 ? -1 : 0);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '>': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 > n2 ? -1 : 0);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '<': (env) => {
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.dStack.push(n1 < n2 ? -1 : 0);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    // BEGIN
    'BEGIN': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: 'BEGIN No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    'WHILE': () => {
        return { status: 1 /* Status.Fail */, value: 'WHILE Not expected' };
    },
    'UNTIL': () => {
        return { status: 1 /* Status.Fail */, value: 'UNTIL Not expected' };
    },
    'REPEAT': () => {
        return { status: 1 /* Status.Fail */, value: 'UNTIL Not expected' };
    },
    // DO
    'DO': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: 'DO No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    '?DO': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: '?DO No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    'I': (env) => {
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: 'I No Interpretation' };
        env.dStack.push(env.rStack.pick(0));
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'J': (env) => {
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: 'J No Interpretation' };
        env.dStack.push(env.rStack.pick(1));
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'LEAVE': (env) => {
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: 'LEAVE No Interpretation' };
        env.isLeave = true;
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'LOOP': () => {
        return { status: 1 /* Status.Fail */, value: 'LOOP Not expected' };
    },
    '+LOOP': () => {
        return { status: 1 /* Status.Fail */, value: '+LOOP Not expected' };
    },
    // IF
    'IF': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: 'IF No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    'ELSE': () => {
        return { status: 1 /* Status.Fail */, value: 'ELSE Not expected' };
    },
    'THEN': () => {
        return { status: 1 /* Status.Fail */, value: 'THEN Not expected' };
    },
    // Tools
    '.S': (env) => {
        return { status: 0 /* Status.Ok */, value: env.dStack.print() };
    },
    'WORDS': () => {
        const words = [
            ...Object.keys(Dictionary.colonDef),
            ...Object.keys(Dictionary.words),
        ].sort();
        const output = [];
        for (let i = 0; i < words.length; i++) {
            if (i % 6 === 0)
                output.push('\n');
            output.push(words[i].padEnd(10, ' '));
        }
        return { status: 0 /* Status.Ok */, value: output.join('') + '\n' };
    },
};
class Executor {
    static run(tokens, env) {
        let outText = '';
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.error)
                return { status: 1 /* Status.Fail */, value: ` ${token.value} ${token.error}` };
            switch (token.kind) {
                case TokenKind.Number:
                    env.dStack.push(Number(token.value));
                    break;
                case TokenKind.Character:
                    env.dStack.push(token.content.charCodeAt(0));
                    break;
                case TokenKind.LineComment:
                case TokenKind.Comment:
                case TokenKind.DotComment:
                    break;
                case TokenKind.String:
                    outText += token.content;
                    break;
                case TokenKind.Value:
                case TokenKind.Constant:
                    return { status: 1 /* Status.Fail */, value: `${token.value} No Execution` };
                case TokenKind.ValueTo:
                    env.value[token.content.toUpperCase()] = env.dStack.pop();
                    break;
                case TokenKind.ColonDef:
                    return { status: 1 /* Status.Fail */, value: `: No Execution` };
                case TokenKind.Word:
                    if (env.isLeave)
                        break;
                    if (token.word === 'IF') {
                        const res = Executor.runIF(tokens, i, env);
                        outText += res.value;
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, value: outText };
                        if (typeof res.newIndex === 'number')
                            i = res.newIndex;
                        break;
                    }
                    if (token.word === 'DO' || token.word === '?DO') {
                        const res = Executor.runDO(tokens, i, env);
                        outText += res.value;
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, value: outText };
                        if (typeof res.newIndex === 'number')
                            i = res.newIndex;
                        break;
                    }
                    if (token.word === 'BEGIN') {
                        const res = Executor.runBEGIN(tokens, i, env);
                        outText += res.value;
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, value: outText };
                        if (typeof res.newIndex === 'number')
                            i = res.newIndex;
                        break;
                    }
                    if (Dictionary.colonDef.hasOwnProperty(token.word)) {
                        const res = Executor.run(Dictionary.colonDef[token.word].tokens, env);
                        outText += res.value;
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, value: outText };
                        break;
                    }
                    if (env.value.hasOwnProperty(token.word)) {
                        env.dStack.push(env.value[token.word]);
                        continue;
                    }
                    if (env.constant.hasOwnProperty(token.word)) {
                        env.dStack.push(env.constant[token.word]);
                        continue;
                    }
                    if (Dictionary.words.hasOwnProperty(token.word)) {
                        const res = Dictionary.words[token.word](env);
                        outText += res.value;
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, value: outText };
                        if (env.isLeave)
                            return { status: 0 /* Status.Ok */, value: outText };
                        break;
                    }
                    return { status: 1 /* Status.Fail */, value: `${outText} ${token.value} Unknown word` };
                default:
                    return { status: 1 /* Status.Fail */, value: `${outText} ${token.value} Executor: Unknown TokenKind` };
            }
        }
        return { status: 0 /* Status.Ok */, value: outText };
    }
    static runIF(tokens, index, env) {
        // Find THEN index
        let thenIndex = index + 1;
        let ifDepth = 1;
        while (true) {
            thenIndex += 1;
            if (thenIndex === tokens.length)
                return { status: 1 /* Status.Fail */, value: 'THEN Is missing' };
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
            return { status: res.status, value: res.value, newIndex: thenIndex };
        }
        if (elseIndex < thenIndex) {
            // Alternative part
            const altTokens = tokens.slice(elseIndex + 1, thenIndex);
            const res = Executor.run(altTokens, env);
            return { status: res.status, value: res.value, newIndex: thenIndex };
        }
        // Continuation
        return { status: 0 /* Status.Ok */, value: '', newIndex: thenIndex };
    }
    static runDO(tokens, index, env) {
        // Find LOOP index
        let loopIndex = index + 1;
        let doDepth = 1;
        while (true) {
            loopIndex += 1;
            if (loopIndex === tokens.length)
                return { status: 1 /* Status.Fail */, value: 'LOOP Not found' };
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
            return { status: 0 /* Status.Ok */, value: '', newIndex: loopIndex };
        }
        const isPlusLoop = tokens[loopIndex].word === '+LOOP';
        if (!isPlusLoop && !upwards)
            return { status: 1 /* Status.Fail */, value: 'LOOP Wrong range' };
        let outText = '';
        while (upwards ? counter < limit : counter >= limit) {
            env.rStack.push(counter);
            const doBody = tokens.slice(index + 1, loopIndex);
            const res = Executor.run(doBody, env);
            env.rStack.pop();
            if (env.isLeave)
                break;
            outText += res.value;
            if (res.status === 1 /* Status.Fail */)
                return { status: 1 /* Status.Fail */, value: outText };
            counter += isPlusLoop ? env.dStack.pop() : 1;
        }
        // Continuation
        env.isLeave = false;
        return { status: 0 /* Status.Ok */, value: outText, newIndex: loopIndex };
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
            return { status: 1 /* Status.Fail */, value: 'WHILE Not found' };
        if (repeatIndex === 0 && untilIndex === 0)
            return { status: 1 /* Status.Fail */, value: 'BEGIN Not closed' };
        if (repeatIndex > 0 && untilIndex > 0)
            return { status: 1 /* Status.Fail */, value: 'BEGIN Control flow mismatched' };
        if (untilIndex > 0 && whileIndex > 0)
            return { status: 1 /* Status.Fail */, value: 'BEGIN Control flow mismatched' };
        let outText = '';
        // BEGIN <init-code> <flag> WHILE <body-code> REPEAT
        if (whileIndex > 0) {
            const initCode = tokens.slice(index + 1, whileIndex);
            const bodyCode = tokens.slice(whileIndex + 1, repeatIndex);
            while (true) {
                const initRes = Executor.run(initCode, env);
                outText += initRes.value;
                if (initRes.status === 1 /* Status.Fail */)
                    return { status: 1 /* Status.Fail */, value: outText };
                const flag = env.dStack.pop();
                if (flag === 0)
                    break;
                const bodyRes = Executor.run(bodyCode, env);
                outText += bodyRes.value;
                if (bodyRes.status === 1 /* Status.Fail */)
                    return { status: 1 /* Status.Fail */, value: outText };
            }
            // Continuation
            return { status: 0 /* Status.Ok */, value: outText, newIndex: repeatIndex };
        }
        // BEGIN <body-code> <flag> UNTIL
        if (untilIndex > 0) {
            const bodyCode = tokens.slice(index + 1, untilIndex);
            while (true) {
                const bodyRes = Executor.run(bodyCode, env);
                outText += bodyRes.value;
                if (bodyRes.status === 1 /* Status.Fail */)
                    return { status: 1 /* Status.Fail */, value: outText };
                const flag = env.dStack.pop();
                if (flag !== 0)
                    break;
            }
            // Continuation
            return { status: 0 /* Status.Ok */, value: outText, newIndex: untilIndex };
        }
        throw new Error('Unreachable');
    }
}
class Forth {
    constructor(output) {
        this.STACK_CAPACITY = 1024;
        this.env = {
            runMode: RunMode.Interpret,
            isLeave: false,
            dStack: new Stack(this.STACK_CAPACITY),
            rStack: new Stack(this.STACK_CAPACITY),
            value: {},
            constant: {},
            tempDef: { name: '', tokens: [] },
            output: output,
        };
    }
    run(tokens, lineText) {
        let outText = '';
        try {
            for (let i = 0; i < tokens.length; i += 1) {
                const token = tokens[i];
                if (token.error) {
                    outText += ` ${token.value}  ${token.error}`;
                    this.die(lineText, outText);
                    return;
                }
                if (this.env.runMode === RunMode.Run) {
                    this.die(lineText, token.value + ' Forth: Run mode not allowed here');
                    return;
                }
                const res = this.env.runMode === RunMode.Interpret
                    ? Interpreter.run(tokens, i, this.env)
                    : Compiler.compile(tokens, i, this.env);
                outText += res.value;
                if (res.status === 1 /* Status.Fail */) {
                    this.die(lineText, outText);
                    return;
                }
            }
        }
        catch (e) {
            this.die(lineText, e.message);
            return;
        }
        const status = this.env.runMode === RunMode.Interpret ? 'ok' : 'compiling';
        const message = outText === '' ? '' : outText.endsWith(' ') ? outText : outText + ' ';
        this.env.output(`${lineText} ${message} ${status}\n`);
    }
    printStack() {
        return this.env.dStack.print();
    }
    die(lineText, message) {
        this.env.dStack.clear();
        this.env.rStack.clear();
        this.env.output(`${lineText}  ${message}\n`);
        this.env.runMode = RunMode.Interpret;
        this.env.isLeave = false;
    }
}
class Interpreter {
    static run(tokens, index, env) {
        const token = tokens[index];
        if (token.error)
            return { status: 1 /* Status.Fail */, value: `${token.value} ${token.error}` };
        switch (token.kind) {
            case TokenKind.Number:
                env.dStack.push(Number(token.value));
                break;
            case TokenKind.Character:
                env.dStack.push(token.content.charCodeAt(0));
                break;
            case TokenKind.LineComment:
            case TokenKind.Comment:
                break;
            case TokenKind.DotComment:
            case TokenKind.String:
                return { status: 1 /* Status.Fail */, value: `${token.word} No Interpretation` };
            case TokenKind.Value:
            case TokenKind.ValueTo:
                env.value[token.content.toUpperCase()] = env.dStack.pop();
                break;
            case TokenKind.Constant:
                env.constant[token.content.toUpperCase()] = env.dStack.pop();
                break;
            case TokenKind.ColonDef:
                env.tempDef = { name: token.content.toUpperCase(), tokens: [] };
                env.runMode = RunMode.Compile;
                break;
            case TokenKind.Word: {
                if (Dictionary.colonDef.hasOwnProperty(token.word)) {
                    env.runMode = RunMode.Run;
                    const res = Executor.run(Dictionary.colonDef[token.word].tokens, env);
                    env.runMode = RunMode.Interpret;
                    return res;
                }
                if (env.value.hasOwnProperty(token.word)) {
                    env.dStack.push(env.value[token.word]);
                    break;
                }
                if (env.constant.hasOwnProperty(token.word)) {
                    env.dStack.push(env.constant[token.word]);
                    break;
                }
                if (Dictionary.words.hasOwnProperty(token.word))
                    return Dictionary.words[token.word](env);
                return { status: 1 /* Status.Fail */, value: `${token.value} Unknown word` };
            }
            default:
                return { status: 1 /* Status.Fail */, value: `${token.value} Interpreter: Unknown TokenKind` };
        }
        return { status: 0 /* Status.Ok */, value: '' };
    }
}
class Parser {
    static parseLine(codeLine, lineNum) {
        const tokens = [];
        const code = codeLine.trimStart();
        let index = 0;
        while (index < code.length) {
            if (code[index] === ' ') {
                index += 1;
                continue;
            }
            let toIndex = code.indexOf(' ', index);
            if (toIndex === -1)
                toIndex = code.length;
            const value = code.slice(index, toIndex);
            const word = value.trimStart().toUpperCase();
            const pos = { line: lineNum, col: index };
            index = toIndex;
            // Words with content
            if (Parser.contentWords.hasOwnProperty(word)) {
                const grammar = Parser.contentWords[word];
                toIndex += 1;
                if (grammar.trimStart) {
                    while (code[toIndex] === ' ')
                        toIndex += 1;
                }
                let endIndex = code.indexOf(grammar.delimiter, toIndex + 1);
                index = endIndex + 1; // Eat the delimiter
                if (endIndex === -1) {
                    index = code.length;
                    endIndex = code.length;
                    if (grammar.strict) {
                        tokens.push({ kind: grammar.kind, error: 'Not Closed', content: '', value, word, pos });
                        continue;
                    }
                }
                let content = code.slice(toIndex, endIndex);
                if (!grammar.empty && content.length === 0) {
                    tokens.push({ kind: grammar.kind, error: 'Empty', content: '', value, word, pos });
                    continue;
                }
                tokens.push({ kind: grammar.kind, error: '', content, value, word, pos });
            }
            else {
                const isNumber = value.match(/^[+-]?\d+(?:.?\d+)?$/);
                const kind = isNumber ? TokenKind.Number : TokenKind.Word;
                tokens.push({ kind, error: '', content: '', value, word, pos });
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
        kind: TokenKind.LineComment,
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
        kind: TokenKind.Comment,
        delimiter: ')',
        trimStart: false,
        strict: true,
        empty: true,
    },
    '.(': {
        kind: TokenKind.DotComment,
        delimiter: ')',
        trimStart: false,
        strict: true,
        empty: true,
    },
    '."': {
        kind: TokenKind.String,
        delimiter: '"',
        trimStart: false,
        strict: true,
        empty: true,
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
        return this.holder.slice(0, this.index).join(' ') + ' <- Top';
    }
}
//# sourceMappingURL=index.js.map