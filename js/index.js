"use strict";
// noinspection JSUnusedGlobalSymbols
class Application {
    // noinspection JSUnusedGlobalSymbols
    constructor() {
        this.OUT_BUFFER_LINES = 24;
        this.STACK_CAPACITY = 1024;
        this.interpreter = new Interpreter(this.STACK_CAPACITY, this.output.bind(this));
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
        this.stackView.innerText = this.interpreter.printStack();
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
        this.interpreter.interpret(tokens, cmdText);
        this.stackView.innerText = this.interpreter.printStack();
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
var Status;
(function (Status) {
    Status[Status["Ok"] = 0] = "Ok";
    Status[Status["Fail"] = 1] = "Fail";
})(Status || (Status = {}));
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Character"] = 0] = "Character";
    TokenKind[TokenKind["Comment"] = 1] = "Comment";
    TokenKind[TokenKind["Keyword"] = 2] = "Keyword";
    TokenKind[TokenKind["LineComment"] = 3] = "LineComment";
    TokenKind[TokenKind["Number"] = 4] = "Number";
    TokenKind[TokenKind["String"] = 5] = "String";
    TokenKind[TokenKind["Word"] = 6] = "Word";
})(TokenKind || (TokenKind = {}));
var RunMode;
(function (RunMode) {
    RunMode[RunMode["Interpret"] = 0] = "Interpret";
    RunMode[RunMode["Compile"] = 1] = "Compile";
    RunMode[RunMode["Run"] = 2] = "Run";
})(RunMode || (RunMode = {}));
class Dictionary {
}
Dictionary.Words = {
    '(': 'paren',
    '*': 'start',
    '+': 'plus',
    '+LOOP': 'plus-loop',
    '-': 'minus',
    '."': 'dot-quote',
    '.': 'dot',
    '/': 'slash',
    ':': 'colon',
    ';': 'semicolon',
    '<': 'less-than',
    '=': 'equals',
    '>': 'greater-than',
    'ABS': 'abs',
    'BL': 'bl',
    'CHAR': 'char',
    'CR': 'cr',
    'DEPTH': 'depth',
    'DO': 'do',
    'DROP': 'drop',
    'DUP': 'dupe',
    'ELSE': 'else',
    'EMIT': 'emit',
    'I': 'i',
    'IF': 'if',
    'J': 'j',
    'LEAVE': 'leave',
    'LOOP': 'loop',
    'MOD': 'mod',
    'OVER': 'over',
    'ROT': 'rot',
    'SPACE': 'space',
    'SPACES': 'spaces',
    'SWAP': 'swap',
    'THEN': 'then',
    '?DUP': 'question-dupe',
    '2DROP': 'two-drop',
    '2DUP': 'two-dupe',
    '2SWAP': 'two-swap',
    '2OVER': 'two-over',
    '>R': 'to-r',
    'R@': 'r-fetch',
    'R>': 'r-from',
    '2>R': 'two-to-r',
    '2R@': 'two-r-fetch',
    '2R>': 'two-r-from',
    // Core extension
    '\\': 'backslash',
    '.(': 'dot-paren',
    '<>': 'not-equals',
    '?DO': 'question-do',
    'NIP': 'nip',
    'TUCK': 'tuck',
    // Tools
    '.S': 'dot-s',
};
Dictionary.CompileOnlyWords = [
    '.(', '."', '?DO', 'DO', 'I', 'J', 'LEAVE', 'LOOP', '+LOOP', ';', 'IF', 'ELSE', 'THEN',
    '>R', 'R@', 'R>', '2>R', '2R@', '2R>',
];
class Interpreter {
    constructor(capacity, output) {
        this.TRUE = -1;
        this.FALSE = 0;
        this.colonDef = {};
        this.keyword = {
            // Comments
            '(': () => {
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '.(': () => {
                return this.runMode === RunMode.Interpret
                    ? { status: 1 /* Status.Fail */, value: ' No Interpretation' }
                    : { status: 0 /* Status.Ok */, value: '' };
            },
            '\\': () => {
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // Char
            'BL': () => {
                // Put the ASCII code of space in Stack
                this.dStack.push(32);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'CHAR': () => {
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // String
            '."': () => {
                return this.runMode === RunMode.Interpret
                    ? { status: 1 /* Status.Fail */, value: ' No Interpretation' }
                    : { status: 0 /* Status.Ok */, value: '' };
            },
            // Output
            'CR': () => {
                return { status: 0 /* Status.Ok */, value: '\n' };
            },
            'EMIT': () => {
                const charCode = this.dStack.pop();
                this.output(String.fromCharCode(charCode));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'SPACE': () => {
                return { status: 0 /* Status.Ok */, value: ' ' };
            },
            'SPACES': () => {
                const count = this.dStack.pop();
                return { status: 0 /* Status.Ok */, value: ' '.repeat(count) };
            },
            // Numbers
            '+': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 + n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '-': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 - n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '*': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 * n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '/': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 / n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'ABS': () => {
                const n1 = this.dStack.pop();
                this.dStack.push(Math.abs(n1));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // Stack manipulation
            '.': () => {
                return { status: 0 /* Status.Ok */, value: this.dStack.pop().toString() + ' ' };
            },
            'DEPTH': () => {
                this.dStack.push(this.dStack.depth());
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'DUP': () => {
                this.dStack.push(this.dStack.pick(0));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'OVER': () => {
                this.dStack.push(this.dStack.pick(1));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'DROP': () => {
                this.dStack.pop();
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'SWAP': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n2);
                this.dStack.push(n1);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'ROT': () => {
                const n3 = this.dStack.pop();
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n2);
                this.dStack.push(n3);
                this.dStack.push(n1);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '?DUP': () => {
                const n = this.dStack.pick(0);
                if (n !== 0)
                    this.dStack.push(this.dStack.pick(0));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'NIP': () => {
                // ( x1 x2 -- x2 )
                const n2 = this.dStack.pop();
                this.dStack.pop(); // n1
                this.dStack.push(n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'TUCK': () => {
                // ( x1 x2 -- x2 x1 x2 )
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n2);
                this.dStack.push(n1);
                this.dStack.push(n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '2DROP': () => {
                // ( x1 x2 -- )
                this.dStack.pop();
                this.dStack.pop();
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '2DUP': () => {
                // ( x1 x2 -- x1 x2 x1 x2 )
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1);
                this.dStack.push(n2);
                this.dStack.push(n1);
                this.dStack.push(n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '2SWAP': () => {
                // ( x1 x2 x3 x4 -- x3 x4 x1 x2 )
                const n4 = this.dStack.pop();
                const n3 = this.dStack.pop();
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n3);
                this.dStack.push(n4);
                this.dStack.push(n1);
                this.dStack.push(n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '2OVER': () => {
                // ( x1 x2 x3 x4 --  x1 x2 x3 x4 x1 x2 )
                const n4 = this.dStack.pop();
                const n3 = this.dStack.pop();
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1);
                this.dStack.push(n2);
                this.dStack.push(n3);
                this.dStack.push(n4);
                this.dStack.push(n1);
                this.dStack.push(n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // Return stack
            '>R': () => {
                // ( x -- ) ( R: -- x )
                const n1 = this.dStack.pop();
                this.rStack.push(n1);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'R@': () => {
                // ( -- x ) ( R: x -- x )
                const n1 = this.rStack.pick(0);
                this.dStack.push(n1);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'R>': () => {
                // ( -- x ) ( R: x -- )
                const n1 = this.rStack.pop();
                this.dStack.push(n1);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '2>R': () => {
                // ( x1 x2 -- ) ( R: -- x1 x2 )
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.rStack.push(n1);
                this.rStack.push(n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '2R@': () => {
                // ( -- x1 x2 ) ( R: x1 x2 -- x1 x2 )
                const n2 = this.rStack.pick(1);
                const n1 = this.rStack.pick(0);
                this.dStack.push(n1);
                this.dStack.push(n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '2R>': () => {
                // ( -- x1 x2 ) ( R: x1 x2 -- )
                const n2 = this.rStack.pop();
                const n1 = this.rStack.pop();
                this.dStack.push(n1);
                this.dStack.push(n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // Comparison
            '=': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 === n2 ? this.TRUE : this.FALSE);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '<>': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 !== n2 ? this.TRUE : this.FALSE);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '>': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 > n2 ? this.TRUE : this.FALSE);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '<': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 < n2 ? this.TRUE : this.FALSE);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // DO
            'I': () => {
                this.dStack.push(this.rStack.pick(0));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'J': () => {
                this.dStack.push(this.rStack.pick(1));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'LEAVE': () => {
                this.isLeaveActivated = true;
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // Tools
            '.S': () => {
                return { status: 0 /* Status.Ok */, value: this.printStack() };
            },
        };
        this.dStack = new Stack(capacity);
        this.rStack = new Stack(capacity);
        this.output = output;
        this.runMode = RunMode.Interpret;
        this.isLeaveActivated = false;
        this.tempColonDef = { name: '', tokens: [] };
    }
    interpret(tokens, lineText) {
        let outText = '';
        try {
            for (let i = 0; i < tokens.length; i += 1) {
                const token = tokens[i];
                if (this.runMode === RunMode.Interpret) {
                    switch (token.kind) {
                        case TokenKind.Number:
                            this.dStack.push(parseInt(token.value));
                            break;
                        case TokenKind.Character:
                            this.dStack.push(token.value.charCodeAt(0));
                            break;
                        case TokenKind.Comment:
                        case TokenKind.LineComment:
                        case TokenKind.String:
                            break;
                        case TokenKind.Keyword: {
                            const wordName = token.value.toUpperCase();
                            if (wordName === ':') {
                                if (i === tokens.length - 1 ||
                                    tokens[i + 1].kind !== TokenKind.Word ||
                                    tokens[i + 1].value === ';') {
                                    this.die(lineText, token.value + ' Empty definition name');
                                    return;
                                }
                                this.tempColonDef = {
                                    name: tokens[i + 1].value.toUpperCase(),
                                    tokens: []
                                };
                                i += 1; // Eat def name
                                this.runMode = RunMode.Compile;
                                continue;
                            }
                            if (Dictionary.CompileOnlyWords.includes(wordName)) {
                                this.die(lineText, token.value + ' No Interpretation');
                                return;
                            }
                            if (!this.keyword.hasOwnProperty(wordName)) {
                                this.die(lineText, token.value + ' Unknown keyword');
                                return;
                            }
                            const res = this.keyword[wordName]();
                            outText += res.value;
                            if (res.status === 1 /* Status.Fail */) {
                                this.die(lineText, outText);
                                return;
                            }
                            break;
                        }
                        case TokenKind.Word: {
                            const wordName = token.value.toUpperCase();
                            if (!this.colonDef.hasOwnProperty(wordName)) {
                                this.die(lineText, token.value + ' Unknown word');
                                return;
                            }
                            this.runMode = RunMode.Run;
                            const res = this.runTokens(this.colonDef[wordName].tokens);
                            this.runMode = RunMode.Interpret;
                            outText += res.value;
                            if (res.status === 1 /* Status.Fail */) {
                                this.die(lineText, outText);
                                return;
                            }
                            break;
                        }
                        default:
                            this.die(lineText, token.value + ' Interpret mode: Unreachable');
                            return;
                    }
                }
                else if (this.runMode === RunMode.Compile) {
                    if (token.value === ':') {
                        this.die(lineText, token.value + ' Nested definition');
                        return;
                    }
                    if (token.value === ';') {
                        this.colonDef[this.tempColonDef.name] = {
                            name: this.tempColonDef.name,
                            tokens: this.tempColonDef.tokens.slice()
                        };
                        this.tempColonDef = { name: '', tokens: [] };
                        this.runMode = RunMode.Interpret;
                        continue;
                    }
                    if (token.kind === TokenKind.Comment && i > 0 && tokens[i - 1].value === '.(') {
                        outText += token.value;
                        continue;
                    }
                    switch (token.kind) {
                        case TokenKind.Comment:
                        case TokenKind.LineComment:
                            break;
                        case TokenKind.Number:
                        case TokenKind.Character:
                        case TokenKind.String:
                        case TokenKind.Keyword:
                            this.tempColonDef.tokens.push(token);
                            break;
                        case TokenKind.Word:
                            if (this.colonDef.hasOwnProperty(token.value.toUpperCase())) {
                                this.tempColonDef.tokens.push(token);
                                break;
                            }
                            this.die(lineText, token.value + ' ?');
                            return;
                        default:
                            this.die(lineText, token.value + ' Compile mode: Unreachable');
                            return;
                    }
                }
                else if (this.runMode === RunMode.Run) {
                    this.die(lineText, token.value + ' You should not be in Run mode here');
                    return;
                }
            }
        }
        catch (e) {
            this.die(lineText, e.message);
            return;
        }
        const status = this.runMode === RunMode.Interpret ? 'ok' : 'compiling';
        const message = outText === '' ? '' : outText.endsWith(' ') ? outText : outText + ' ';
        this.output(`${lineText} ${message} ${status}\n`);
    }
    printStack() {
        return this.dStack.print();
    }
    runTokens(tokens) {
        let outText = '';
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            switch (token.kind) {
                case TokenKind.Number:
                    this.dStack.push(parseInt(token.value));
                    break;
                case TokenKind.Comment:
                case TokenKind.LineComment:
                    break;
                case TokenKind.Character:
                    this.dStack.push(token.value.charCodeAt(0));
                    break;
                case TokenKind.String:
                    outText += token.value;
                    break;
                case TokenKind.Keyword: {
                    const wordName = token.value.toUpperCase();
                    if (this.isLeaveActivated)
                        break;
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
                        const flag = this.dStack.pop();
                        if (flag === 0) {
                            if (elseIndex < thenIndex) {
                                const res = this.runTokens(tokens.slice(elseIndex + 1, thenIndex));
                                outText += res.value;
                                if (res.status === 1 /* Status.Fail */)
                                    return { status: 1 /* Status.Fail */, value: outText };
                            }
                            i = thenIndex + 1;
                            continue;
                        }
                        else {
                            const res = this.runTokens(tokens.slice(i + 1, elseIndex));
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
                        let counter = this.dStack.pop();
                        const limit = this.dStack.pop();
                        const upwards = limit > counter;
                        if (isQuestionDup && counter === limit) {
                            i = loopIndex;
                            this.isLeaveActivated = false;
                            continue;
                        }
                        if (!isPlusLoop && !upwards)
                            return { status: 1 /* Status.Fail */, value: ' LOOP wrong range' };
                        while (upwards ? counter < limit : counter >= limit) {
                            this.rStack.push(counter);
                            const res = this.runTokens(tokens.slice(i + 1, loopIndex));
                            this.rStack.pop();
                            if (this.isLeaveActivated)
                                break;
                            outText += res.value;
                            if (res.status === 1 /* Status.Fail */)
                                return { status: 1 /* Status.Fail */, value: outText };
                            counter += isPlusLoop ? this.dStack.pop() : 1;
                        }
                        i = loopIndex;
                        this.isLeaveActivated = false;
                        continue;
                    }
                    if (!this.keyword.hasOwnProperty(wordName))
                        return { status: 1 /* Status.Fail */, value: token.value + ' Unknown keyword' };
                    const res = this.keyword[wordName]();
                    outText += res.value;
                    if (res.status === 1 /* Status.Fail */)
                        return { status: 1 /* Status.Fail */, value: outText };
                    break;
                }
                case TokenKind.Word: {
                    const wordName = token.value.toUpperCase();
                    if (!this.colonDef.hasOwnProperty(wordName))
                        return { status: 1 /* Status.Fail */, value: token.value + ' Unknown word' };
                    const res = this.runTokens(this.colonDef[wordName].tokens);
                    outText += res.value;
                    if (res.status === 1 /* Status.Fail */)
                        return { status: 1 /* Status.Fail */, value: outText };
                    break;
                }
                default:
                    throw new Error('runTokens:  Unreachable');
            }
        }
        return { status: 0 /* Status.Ok */, value: outText };
    }
    die(lineText, message) {
        this.dStack.clear();
        this.rStack.clear();
        this.output(`${lineText} ${message}\n`);
        this.runMode = RunMode.Interpret;
        this.isLeaveActivated = false;
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
                    if (Dictionary.Words.hasOwnProperty(word.toUpperCase()))
                        tokens.push({ kind: TokenKind.Keyword, value: word, pos });
                    else if (word.match(/^[+-]?\d+$/))
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