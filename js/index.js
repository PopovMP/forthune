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
        const tokens = Tokenizer.tokenizeLine(cmdText, lineNum);
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
        if (token.value === ':') {
            return { status: 1 /* Status.Fail */, value: token.value + '  Nested definition' };
        }
        if (token.value === ';') {
            Dictionary.colonDef[env.tempDef.name] = {
                name: env.tempDef.name,
                tokens: env.tempDef.tokens.slice()
            };
            env.tempDef = { name: '', tokens: [] };
            env.runMode = RunMode.Interpret;
            return { status: 0 /* Status.Ok */, value: '' };
        }
        if (token.kind === TokenKind.Comment &&
            index > 0 && tokens[index - 1].value === '.(') {
            return { status: 0 /* Status.Ok */, value: token.value };
        }
        switch (token.kind) {
            case TokenKind.Comment:
            case TokenKind.LineComment:
                break;
            case TokenKind.Number:
            case TokenKind.Character:
            case TokenKind.String:
            case TokenKind.Value:
            case TokenKind.Constant:
                env.tempDef.tokens.push(token);
                break;
            case TokenKind.Word:
                const wordName = token.value.toUpperCase();
                if (Dictionary.words.hasOwnProperty(wordName) ||
                    Dictionary.colonDef.hasOwnProperty(wordName) ||
                    env.value.hasOwnProperty(wordName)) {
                    env.tempDef.tokens.push(token);
                    break;
                }
                return { status: 1 /* Status.Fail */, value: token.value + '  Unknown word' };
            default:
                return { status: 1 /* Status.Fail */, value: token.value + '  Compile mode: Unreachable' };
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
    TokenKind[TokenKind["Comment"] = 1] = "Comment";
    TokenKind[TokenKind["LineComment"] = 2] = "LineComment";
    TokenKind[TokenKind["Number"] = 3] = "Number";
    TokenKind[TokenKind["String"] = 4] = "String";
    TokenKind[TokenKind["Word"] = 5] = "Word";
    TokenKind[TokenKind["Value"] = 6] = "Value";
    TokenKind[TokenKind["Constant"] = 7] = "Constant";
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
            ? { status: 1 /* Status.Fail */, value: ' .( No Interpretation' }
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
        // ( x1 x2 x3 x4 --  x1 x2 x3 x4 x1 x2 )
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
            return { status: 1 /* Status.Fail */, value: ' >R  No Interpretation' };
        const n1 = env.dStack.pop();
        env.rStack.push(n1);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'R@': (env) => {
        // ( -- x ) ( R: x -- x )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: ' R@  No Interpretation' };
        const n1 = env.rStack.pick(0);
        env.dStack.push(n1);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'R>': (env) => {
        // ( -- x ) ( R: x -- )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: ' R>  No Interpretation' };
        const n1 = env.rStack.pop();
        env.dStack.push(n1);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '2>R': (env) => {
        // ( x1 x2 -- ) ( R: -- x1 x2 )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: ' 2>R  No Interpretation' };
        const n2 = env.dStack.pop();
        const n1 = env.dStack.pop();
        env.rStack.push(n1);
        env.rStack.push(n2);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '2R@': (env) => {
        // ( -- x1 x2 ) ( R: x1 x2 -- x1 x2 )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: ' 2R@  No Interpretation' };
        const n2 = env.rStack.pick(1);
        const n1 = env.rStack.pick(0);
        env.dStack.push(n1);
        env.dStack.push(n2);
        return { status: 0 /* Status.Ok */, value: '' };
    },
    '2R>': (env) => {
        // ( -- x1 x2 ) ( R: x1 x2 -- )
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: ' 2R>  No Interpretation' };
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
    // DO
    'DO': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: ' DO  No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    '?DO': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: ' ?DO  No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    'I': (env) => {
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: ' I  No Interpretation' };
        env.dStack.push(env.rStack.pick(0));
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'J': (env) => {
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: ' J  No Interpretation' };
        env.dStack.push(env.rStack.pick(1));
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'LEAVE': (env) => {
        if (env.runMode === RunMode.Interpret)
            return { status: 1 /* Status.Fail */, value: ' LEAVE  No Interpretation' };
        env.isLeave = true;
        return { status: 0 /* Status.Ok */, value: '' };
    },
    'LOOP': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: ' LOOP No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    '+LOOP': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: ' +LOOP No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    // IF
    'IF': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: ' IF  No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    'ELSE': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: ' ELSE  No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    'THEN': (env) => {
        return env.runMode === RunMode.Interpret
            ? { status: 1 /* Status.Fail */, value: ' THEN  No Interpretation' }
            : { status: 0 /* Status.Ok */, value: '' };
    },
    // Tools
    '.S': (env) => {
        return { status: 0 /* Status.Ok */, value: env.dStack.print() };
    },
};
class Executor {
    static run(tokens, env) {
        let outText = '';
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            switch (token.kind) {
                case TokenKind.Number:
                    env.dStack.push(parseInt(token.value));
                    break;
                case TokenKind.Comment:
                case TokenKind.LineComment:
                    break;
                case TokenKind.Character:
                    env.dStack.push(token.value.charCodeAt(0));
                    break;
                case TokenKind.String:
                    outText += token.value;
                    break;
                case TokenKind.Word:
                    const wordName = token.value.toUpperCase();
                    if (env.isLeave)
                        break;
                    if (wordName === 'CONSTANT' || wordName === 'VALUE')
                        return { status: 1 /* Status.Fail */, value: ` ${wordName}  used in execution mode` };
                    if (wordName === 'TO') {
                        if (i >= tokens.length || tokens[i + 1].kind !== TokenKind.Value)
                            return { status: 1 /* Status.Fail */, value: ` TO  used without name` };
                        const valName = tokens[i + 1].value.toUpperCase();
                        env.value[valName] = env.dStack.pop();
                        i += 1; // Eat value name
                        break;
                    }
                    if (wordName === 'IF') {
                        let thenIndex = i + 1;
                        let ifDepth = 1;
                        while (true) {
                            thenIndex += 1;
                            if (thenIndex === tokens.length)
                                return { status: 1 /* Status.Fail */, value: ' THEN not found' };
                            const loopWord = tokens[thenIndex].value.toUpperCase();
                            if (loopWord === 'IF')
                                ifDepth += 1;
                            if (loopWord === 'THEN')
                                ifDepth -= 1;
                            if (ifDepth === 0)
                                break;
                        }
                        let elseIndex = i + 1;
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
                        if (flag === 0) {
                            if (elseIndex < thenIndex) {
                                const res = Executor.run(tokens.slice(elseIndex + 1, thenIndex), env);
                                outText += res.value;
                                if (res.status === 1 /* Status.Fail */)
                                    return { status: 1 /* Status.Fail */, value: outText };
                            }
                            i = thenIndex + 1;
                            continue;
                        }
                        else {
                            const res = Executor.run(tokens.slice(i + 1, elseIndex), env);
                            outText += res.value;
                            if (res.status === 1 /* Status.Fail */)
                                return { status: 1 /* Status.Fail */, value: outText };
                            i = thenIndex + 1;
                            continue;
                        }
                    }
                    if (wordName === 'DO' || wordName === '?DO') {
                        const isQuestionDup = wordName === '?DO';
                        let loopIndex = i + 1;
                        let doDepth = 1;
                        while (true) {
                            loopIndex += 1;
                            if (loopIndex === tokens.length)
                                return { status: 1 /* Status.Fail */, value: ' LOOP not found' };
                            const loopWord = tokens[loopIndex].value.toUpperCase();
                            if (loopWord === 'DO')
                                doDepth += 1;
                            if (loopWord === 'LOOP' || loopWord === '+LOOP')
                                doDepth -= 1;
                            if (doDepth === 0)
                                break;
                        }
                        const isPlusLoop = tokens[loopIndex].value.toUpperCase() === '+LOOP';
                        let counter = env.dStack.pop();
                        const limit = env.dStack.pop();
                        const upwards = limit > counter;
                        if (isQuestionDup && counter === limit) {
                            i = loopIndex;
                            env.isLeave = false;
                            continue;
                        }
                        if (!isPlusLoop && !upwards)
                            return { status: 1 /* Status.Fail */, value: ' LOOP wrong range' };
                        while (upwards ? counter < limit : counter >= limit) {
                            env.rStack.push(counter);
                            const res = Executor.run(tokens.slice(i + 1, loopIndex), env);
                            env.rStack.pop();
                            if (env.isLeave)
                                break;
                            outText += res.value;
                            if (res.status === 1 /* Status.Fail */)
                                return { status: 1 /* Status.Fail */, value: outText };
                            counter += isPlusLoop ? env.dStack.pop() : 1;
                        }
                        i = loopIndex;
                        env.isLeave = false;
                        continue;
                    }
                    if (Dictionary.colonDef.hasOwnProperty(wordName)) {
                        const res = Executor.run(Dictionary.colonDef[wordName].tokens, env);
                        outText += res.value;
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, value: outText };
                        break;
                    }
                    if (env.value.hasOwnProperty(wordName)) {
                        env.dStack.push(env.value[wordName]);
                        continue;
                    }
                    if (env.constant.hasOwnProperty(wordName)) {
                        env.dStack.push(env.constant[wordName]);
                        continue;
                    }
                    if (Dictionary.words.hasOwnProperty(wordName)) {
                        const res = Dictionary.words[wordName](env);
                        outText += res.value;
                        if (res.status === 1 /* Status.Fail */)
                            return { status: 1 /* Status.Fail */, value: outText };
                        if (env.isLeave)
                            return { status: 0 /* Status.Ok */, value: outText };
                        break;
                    }
                    return { status: 1 /* Status.Fail */, value: `${outText} ${token.value}  Unknown word` };
                default:
                    throw new Error('runTokens:  Unreachable');
            }
        }
        return { status: 0 /* Status.Ok */, value: outText };
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
                switch (this.env.runMode) {
                    case RunMode.Interpret: {
                        const res = Interpreter.run(tokens, i, this.env);
                        outText += res.value;
                        if (res.status === 1 /* Status.Fail */) {
                            this.die(lineText, outText);
                            return;
                        }
                        // Increment i because the name is eaten by Interpreter / Executor
                        const wordName = token.value.toUpperCase();
                        if ([':', 'VALUE', 'TO', 'CONSTANT'].includes(wordName))
                            i += 1;
                        break;
                    }
                    case RunMode.Compile: {
                        const res = Compiler.compile(tokens, i, this.env);
                        outText += res.value;
                        if (res.status === 1 /* Status.Fail */) {
                            this.die(lineText, outText);
                            return;
                        }
                        break;
                    }
                    case RunMode.Run:
                        this.die(lineText, token.value + '  You should not be in Run mode here');
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
        this.env.output(`${lineText} ${message}\n`);
        this.env.runMode = RunMode.Interpret;
        this.env.isLeave = false;
    }
}
class Interpreter {
    static run(tokens, index, env) {
        const token = tokens[index];
        switch (token.kind) {
            case TokenKind.Number:
                env.dStack.push(parseInt(token.value));
                break;
            case TokenKind.Character:
                env.dStack.push(token.value.charCodeAt(0));
                break;
            case TokenKind.Comment:
            case TokenKind.LineComment:
            case TokenKind.String:
                break;
            case TokenKind.Word: {
                const wordName = token.value.toUpperCase();
                if (wordName === 'VALUE' || wordName === 'TO') {
                    if (index >= tokens.length || tokens[index + 1].kind !== TokenKind.Value)
                        return { status: 1 /* Status.Fail */, value: ` ${wordName}  used without name` };
                    const valName = tokens[index + 1].value.toUpperCase();
                    env.value[valName] = env.dStack.pop();
                    break;
                }
                if (wordName === 'CONSTANT') {
                    if (index >= tokens.length || tokens[index + 1].kind !== TokenKind.Constant)
                        return { status: 1 /* Status.Fail */, value: ` CONSTANT  used without name` };
                    const constName = tokens[index + 1].value.toUpperCase();
                    env.constant[constName] = env.dStack.pop();
                    break;
                }
                if (wordName === ':') {
                    if (index === tokens.length - 1 ||
                        tokens[index + 1].kind !== TokenKind.Word ||
                        tokens[index + 1].value === ';') {
                        return { status: 1 /* Status.Fail */, value: token.value + '  Empty definition name' };
                    }
                    env.tempDef = {
                        name: tokens[index + 1].value.toUpperCase(),
                        tokens: []
                    };
                    env.runMode = RunMode.Compile;
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                if (Dictionary.colonDef.hasOwnProperty(wordName)) {
                    env.runMode = RunMode.Run;
                    const res = Executor.run(Dictionary.colonDef[wordName].tokens, env);
                    env.runMode = RunMode.Interpret;
                    return res;
                }
                if (env.value.hasOwnProperty(wordName)) {
                    env.dStack.push(env.value[wordName]);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                if (env.constant.hasOwnProperty(wordName)) {
                    env.dStack.push(env.constant[wordName]);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                if (Dictionary.words.hasOwnProperty(wordName)) {
                    return Dictionary.words[wordName](env);
                }
                return { status: 1 /* Status.Fail */, value: token.value + '  Unknown word' };
            }
            default:
                return { status: 1 /* Status.Fail */, value: token.value + '  Interpret mode: Unreachable' };
        }
        return { status: 0 /* Status.Ok */, value: '' };
    }
}
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
class Tokenizer {
    static tokenizeLine(codeLine, lineNum) {
        const tokens = [];
        let index = 0;
        let prevWord = '';
        while (index < codeLine.length) {
            // Eat leading white space
            if (prevWord !== '."') {
                while (codeLine[index] === ' ' || codeLine[index] === '\t') {
                    if (index >= codeLine.length)
                        break;
                    index += 1;
                }
            }
            const pos = { line: lineNum, col: index };
            switch (prevWord) {
                case '\\': {
                    // Eat line comment delimited by <newline>
                    const toIndex = this.findIndex(codeLine, '\n', index);
                    const comment = codeLine.slice(index, toIndex);
                    tokens.push({ kind: TokenKind.LineComment, value: comment, pos });
                    index = toIndex + 1;
                    prevWord = '';
                    break;
                }
                case '(':
                case '.(': {
                    // Eat comment delimited by <paren>
                    const toIndex = this.findIndex(codeLine, ')', index);
                    const comment = codeLine.slice(index, toIndex);
                    tokens.push({ kind: TokenKind.Comment, value: comment, pos });
                    index = toIndex + 1;
                    prevWord = '';
                    break;
                }
                case 'CHAR': {
                    // Eat character delimited by <space>
                    const toIndex = this.findIndex(codeLine, ' ', index);
                    const char = codeLine.slice(index, toIndex).slice(0, 1);
                    tokens.push({ kind: TokenKind.Character, value: char, pos });
                    index = toIndex + 1;
                    prevWord = '';
                    break;
                }
                case 'VALUE':
                case 'TO': {
                    // Eat VALUE's name delimited by <space>
                    const toIndex = this.findIndex(codeLine, ' ', index);
                    const valueName = codeLine.slice(index, toIndex).toUpperCase();
                    tokens.push({ kind: TokenKind.Value, value: valueName, pos });
                    index = toIndex + 1;
                    prevWord = '';
                    break;
                }
                case 'CONSTANT': {
                    // Eat CONSTANT's name delimited by <space>
                    const toIndex = this.findIndex(codeLine, ' ', index);
                    const constName = codeLine.slice(index, toIndex).toUpperCase();
                    tokens.push({ kind: TokenKind.Constant, value: constName, pos });
                    index = toIndex + 1;
                    prevWord = '';
                    break;
                }
                case '."': {
                    // Eat string delimited by <comma>
                    const toIndex = this.findIndex(codeLine, '"', index);
                    const text = codeLine.slice(index, toIndex);
                    tokens.push({ kind: TokenKind.String, value: text, pos });
                    index = toIndex + 1;
                    prevWord = '';
                    break;
                }
                default: {
                    // Eat word delimited by <space>
                    const toIndex = this.findIndex(codeLine, ' ', index);
                    const word = codeLine.slice(index, toIndex);
                    if (word.match(/^[+-]?\d+$/))
                        tokens.push({ kind: TokenKind.Number, value: word, pos });
                    else
                        tokens.push({ kind: TokenKind.Word, value: word, pos });
                    index = toIndex + 1;
                    prevWord = word.toUpperCase();
                    break;
                }
            }
        }
        return tokens;
    }
    static stringify(tokens) {
        return tokens.map((token) => {
            switch (token.kind) {
                case TokenKind.Comment: return token.value + ')';
                case TokenKind.String: return token.value + '"';
                default: return token.value;
            }
        }).join(' ');
    }
    static findIndex(text, delimiter, fromIndex) {
        let i = fromIndex;
        while (text[i] !== delimiter && i < text.length)
            i += 1;
        return i;
    }
}
module.exports = {
    Tokenizer
};
//# sourceMappingURL=index.js.map