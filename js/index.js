"use strict";
// noinspection JSUnusedGlobalSymbols
class Application {
    // noinspection JSUnusedGlobalSymbols
    constructor() {
        this.OUT_BUFFER_LINES = 23;
        this.forthune = new Forthune();
        this.screen = document.getElementById('screen');
        this.outputLog = document.getElementById('output-log');
        this.inputLine = document.getElementById('input-line');
        this.stackView = document.getElementById('stack-view');
        this.wordsElem = document.getElementById('dictionary');
        this.readBuffer = [];
        this.outputBuffer = [];
        this.readBufferIndex = 0;
        this.inputLine.addEventListener("keydown", this.readline_keydown.bind(this));
        this.forthune.output = this.output.bind(this);
        this.outputLog.innerText = '';
        this.inputLine.value = '';
        this.stackView.innerText = ' <top';
        this.outputLog.addEventListener('click', () => this.inputLine.focus());
        this.screen.addEventListener('click', () => this.inputLine.focus());
        this.inputLine.focus();
        this.wordsElem.innerHTML = this.forthune.getWords()
            .map(word => `<strong>${word.value.toString().padEnd(5, ' ').replace(/ /g, '&nbsp;')}</strong> ${word.see}`)
            .join('<br/>');
        document.addEventListener('click', () => this.inputLine.focus());
    }
    readline_keydown(event) {
        if (event.code === 'Enter') {
            event.preventDefault();
            const cmdText = this.inputLine.value.trim();
            this.inputLine.value = '';
            if (this.readBuffer.length === 0 || this.readBuffer[this.readBuffer.length - 1] !== cmdText) {
                this.readBuffer.push(cmdText);
                this.readBufferIndex = this.readBuffer.length - 1;
            }
            this.forthune.manageInput(cmdText);
            this.stackView.innerText = this.forthune.getStack().join(' ') + ' <top';
            return;
        }
        if (event.code === 'ArrowUp') {
            event.preventDefault();
            if (this.readBuffer.length > 0)
                this.inputLine.value = this.readBuffer[this.readBufferIndex];
            if (this.readBufferIndex > 0)
                this.readBufferIndex -= 1;
        }
        if (event.code === 'ArrowDown') {
            event.preventDefault();
            if (this.readBufferIndex < this.readBuffer.length - 1) {
                this.readBufferIndex += 1;
                this.inputLine.value = this.readBuffer[this.readBufferIndex];
            }
        }
    }
    output(text) {
        this.outputBuffer.push(text);
        while (this.outputBuffer.length > this.OUT_BUFFER_LINES)
            this.outputBuffer.shift();
        this.outputLog.innerText = this.outputBuffer.join('\n');
    }
}
var Kind;
(function (Kind) {
    Kind[Kind["Word"] = 0] = "Word";
    Kind[Kind["Number"] = 1] = "Number";
    Kind[Kind["ColonDef"] = 2] = "ColonDef";
    Kind[Kind["Unknown"] = 3] = "Unknown";
})(Kind || (Kind = {}));
var Status;
(function (Status) {
    Status[Status["Ok"] = 0] = "Ok";
    Status[Status["Fail"] = 1] = "Fail";
})(Status || (Status = {}));
class Forthune {
    constructor() {
        this.TRUE = -1;
        this.FALSE = 0;
        this.output = (_text) => { };
        this.stack = [];
        this.knownWords = this.getKnownWords();
        this.colonWords = {};
        this.colonDef = undefined;
    }
    manageInput(inputText) {
        const res = this.manageInputText(inputText);
        if (res.status === 1 /* Status.Fail */) {
            this.clearStack();
            this.output(res.value);
            return;
        }
        if (this.colonDef)
            this.output(inputText);
        else
            this.output(`${inputText} ${res.value === '' ? '' : res.value + ' '} ok`);
    }
    manageInputText(inputText) {
        const cmdTexts = inputText.split(/[ \t]/).map(cmdText => cmdText.trim()).filter(cmdText => cmdText !== '');
        let outText = '';
        let commentStarted = false;
        for (const cmdText of cmdTexts) {
            if (cmdText === '(') {
                commentStarted = true;
                continue;
            }
            if (cmdText === ':') {
                if (this.colonDef)
                    return { status: 1 /* Status.Fail */, value: `${cmdText} Colon definition already started` };
                this.colonDef = { name: '', comment: '', content: [] };
                continue;
            }
            if (this.colonDef) {
                if (this.colonDef.name === '') {
                    this.colonDef.name = cmdText;
                    continue;
                }
                if (cmdText === ';') {
                    if (this.colonDef.name === '')
                        return { status: 1 /* Status.Fail */, value: `${inputText} Attempt to use zero-length string as a name` };
                    this.colonWords[this.colonDef.name] = this.colonDef;
                    this.colonDef = undefined;
                    continue;
                }
                if (cmdText === ')' || cmdText.endsWith(')')) {
                    commentStarted = false;
                    continue;
                }
                if (commentStarted) {
                    this.colonDef.comment += cmdText;
                    continue;
                }
                this.colonDef.content.push(cmdText);
                continue;
            }
            if (commentStarted) {
                continue;
            }
            if (cmdText === ')' || cmdText.endsWith(')')) {
                commentStarted = false;
                continue;
            }
            const res = this.execute(cmdText);
            if (res.status === 1 /* Status.Fail */)
                return { status: 1 /* Status.Fail */, value: `${inputText} ${res.value}` };
            outText += res.value;
        }
        return { status: 0 /* Status.Ok */, value: outText };
    }
    getStack() {
        return this.stack.slice();
    }
    getWords() {
        return Object.keys(this.knownWords).map(key => this.knownWords[key]);
    }
    clearStack() {
        while (this.stack.length > 0)
            this.stack.pop();
    }
    execute(cmdText) {
        const cmd = this.parse(cmdText);
        switch (cmd.kind) {
            case 1 /* Kind.Number */:
                this.stack.push(cmd.value);
                return { status: 0 /* Status.Ok */, value: '' };
            case 0 /* Kind.Word */:
                return this.executeWord(cmdText, cmd.value);
            case 2 /* Kind.ColonDef */:
                return this.manageInputText(cmd.value);
            case 3 /* Kind.Unknown */:
                return { status: 1 /* Status.Fail */, value: `${cmdText} ?` };
            default:
                return { status: 1 /* Status.Fail */, value: `${cmdText} ?` };
        }
    }
    parse(cmdText) {
        if (this.knownWords.hasOwnProperty(cmdText))
            return this.knownWords[cmdText];
        if (this.colonWords.hasOwnProperty(cmdText)) {
            const value = this.colonWords[cmdText].content.join(' ');
            return { kind: 2 /* Kind.ColonDef */, value, see: value };
        }
        if (cmdText.match(/[+-]?\d+/)) {
            const value = parseInt(cmdText);
            return { kind: 1 /* Kind.Number */, value, see: String(value) };
        }
        if (cmdText.match(/[+-]?\d+.\d+/)) {
            const value = parseFloat(cmdText);
            return { kind: 1 /* Kind.Number */, value, see: String(value) };
        }
        return { kind: 3 /* Kind.Unknown */, value: `${cmdText} ?`, see: '' };
    }
    getKnownWords() {
        return {
            '.': { kind: 0 /* Kind.Word */, value: '.', see: 'dot   ( n -- ) - Display n in free field format.' },
            '.s': { kind: 0 /* Kind.Word */, value: '.s', see: 'dot-s ( -- ) - Display the stack in free field format.' },
            ':': { kind: 0 /* Kind.Word */, value: ':', see: 'colon ( name -- colon-sys ) - Create a definition for name.' },
            ';': { kind: 0 /* Kind.Word */, value: ';', see: 'semicolon ( colon-sys -- ) - Terminate a colon-definition.' },
            '(': { kind: 0 /* Kind.Word */, value: '(', see: 'paren ( comment -- ) - Start a comment.' },
            '+': { kind: 0 /* Kind.Word */, value: '+', see: 'plus  ( n1 n2 -- n3 ) - Add n2 to n1, giving the sum n3.' },
            '-': { kind: 0 /* Kind.Word */, value: '-', see: 'minus ( n1 n2 -- n3 ) - Subtract n2 from n1 , giving the difference n3.' },
            '*': { kind: 0 /* Kind.Word */, value: '*', see: 'start ( n1 n2 -- n3 ) - Multiply n1 by n2 giving the product n3.' },
            '/': { kind: 0 /* Kind.Word */, value: '/', see: 'slash ( n1 n2 -- n3 ) - Divide n1 by n2, giving the single-cell quotient n3.' },
            '=': { kind: 0 /* Kind.Word */, value: '=', see: 'equals       ( n1 n2 -- flag ) - flag is true if and only if x1 is bit-for-bit the same as x2.' },
            '<>': { kind: 0 /* Kind.Word */, value: '<>', see: 'not-equals   ( n1 n2 -- flag ) - flag is true if and only if x1 is not bit-for-bit the same as x2.' },
            '>': { kind: 0 /* Kind.Word */, value: '>', see: 'greater-than ( n1 n2 -- flag ) - flag is true if and only if n1 is greater than n2.' },
            '<': { kind: 0 /* Kind.Word */, value: '<', see: 'less-than    ( n1 n2 -- flag ) - flag is true if and only if n1 is less than n2.' },
            'abs': { kind: 0 /* Kind.Word */, value: 'abs', see: 'abs   ( n -- u ) - Push the absolute value of n.' },
            'depth': { kind: 0 /* Kind.Word */, value: 'depth', see: 'depth ( -- +n ) - Push the depth of the stack.' },
            'drop': { kind: 0 /* Kind.Word */, value: 'drop', see: 'drop  ( x -- ) - Remove x from the stack.' },
            'dup': { kind: 0 /* Kind.Word */, value: 'dup', see: 'dupe  ( x -- x x ) - Duplicate x.' },
            'mod': { kind: 0 /* Kind.Word */, value: 'mod', see: 'mod   ( n1 n2 -- n3 ) - Divide n1 by n2, giving the single-cell remainder n3.' },
            'over': { kind: 0 /* Kind.Word */, value: 'over', see: 'over  ( x1 x2 -- x1 x2 x1 ) - Place a copy of x1 on top of the stack.' },
            'rot': { kind: 0 /* Kind.Word */, value: 'rot', see: 'rote  ( x1 x2 x3 -- x2 x3 x1 ) - Rotate the top three stack entries.' },
            'swap': { kind: 0 /* Kind.Word */, value: 'swap', see: 'swap  ( x1 x2 -- x2 x1 ) - Exchange the top two stack items.' },
        };
    }
    executeWord(cmdText, cmdValue) {
        switch (cmdValue) {
            case '.':
                if (this.stack.length >= 1) {
                    const a = this.stack.pop();
                    return { status: 0 /* Status.Ok */, value: String(a) };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case '.s':
                return { status: 0 /* Status.Ok */, value: this.stack.join(' ') };
            case '+':
                if (this.stack.length >= 2) {
                    const n2 = this.stack.pop();
                    const n1 = this.stack.pop();
                    const res = n1 + n2;
                    this.stack.push(res);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case '-':
                if (this.stack.length >= 2) {
                    const n2 = this.stack.pop();
                    const n1 = this.stack.pop();
                    const res = n1 - n2;
                    this.stack.push(res);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case '*':
                if (this.stack.length >= 2) {
                    const n2 = this.stack.pop();
                    const n1 = this.stack.pop();
                    const res = n1 * n2;
                    this.stack.push(res);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case '/':
                if (this.stack.length >= 2) {
                    const n2 = this.stack.pop();
                    const n1 = this.stack.pop();
                    const res = n1 / n2;
                    this.stack.push(res);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case '=':
                if (this.stack.length >= 2) {
                    const n2 = this.stack.pop();
                    const n1 = this.stack.pop();
                    const res = n1 === n2 ? this.TRUE : this.FALSE;
                    this.stack.push(res);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case '<>':
                if (this.stack.length >= 2) {
                    const n2 = this.stack.pop();
                    const n1 = this.stack.pop();
                    const res = n1 !== n2 ? this.TRUE : this.FALSE;
                    this.stack.push(res);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case '>':
                if (this.stack.length >= 2) {
                    const n2 = this.stack.pop();
                    const n1 = this.stack.pop();
                    const res = n1 > n2 ? this.TRUE : this.FALSE;
                    this.stack.push(res);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case '<':
                if (this.stack.length >= 2) {
                    const n2 = this.stack.pop();
                    const n1 = this.stack.pop();
                    const res = n1 < n2 ? this.TRUE : this.FALSE;
                    this.stack.push(res);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case 'depth':
                this.stack.push(this.stack.length);
                return { status: 0 /* Status.Ok */, value: '' };
            case 'abs':
                if (this.stack.length > 0) {
                    const n = this.stack.pop();
                    this.stack.push(Math.abs(n));
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case 'drop':
                if (this.stack.length > 0) {
                    this.stack.pop();
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case 'dup':
                if (this.stack.length > 0) {
                    const x1 = this.stack.pop();
                    this.stack.push(x1);
                    this.stack.push(x1);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case 'mod':
                if (this.stack.length >= 2) {
                    const n2 = this.stack.pop();
                    const n1 = this.stack.pop();
                    const res = n1 % n2;
                    this.stack.push(res);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case 'over':
                if (this.stack.length >= 2) {
                    const x2 = this.stack.pop();
                    const x1 = this.stack.pop();
                    this.stack.push(x1);
                    this.stack.push(x2);
                    this.stack.push(x1);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case 'swap':
                if (this.stack.length >= 2) {
                    const x2 = this.stack.pop();
                    const x1 = this.stack.pop();
                    this.stack.push(x2);
                    this.stack.push(x1);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            case 'rot':
                if (this.stack.length >= 2) {
                    const x3 = this.stack.pop();
                    const x2 = this.stack.pop();
                    const x1 = this.stack.pop();
                    this.stack.push(x2);
                    this.stack.push(x3);
                    this.stack.push(x1);
                    return { status: 0 /* Status.Ok */, value: '' };
                }
                return { status: 1 /* Status.Fail */, value: 'Stack underflow' };
            default:
                return { status: 1 /* Status.Fail */, value: `${cmdText} ?` };
        }
    }
}
//# sourceMappingURL=index.js.map