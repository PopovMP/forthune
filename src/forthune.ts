class Forthune
{
	private readonly TRUE  = -1
	private readonly FALSE =  0

	private readonly stack: number[]
	private readonly knownWords: {[name: string]: Command}
	private readonly colonWords: {[name: string]: ColonDef}

	public output = (_text :string) => {}

	private colonDef: ColonDef|undefined

	constructor()
	{
		this.stack      = []
		this.knownWords = this.getKnownWords()
		this.colonWords = {}
		this.colonDef   = undefined
	}

	public manageInput(inputText: string): void
	{
		const res: ExecResult = this.manageInputText(inputText)

		if (res.status === Status.Fail) {
			this.clearStack()
			this.output(res.value)
			return
		}

		if (this.colonDef)
			this.output(inputText)
		else
			this.output(`${inputText} ${res.value}  ok`)
	}

	private manageInputText(inputText: string): ExecResult
	{
		const cmdTexts = inputText.split(/[ \t]/).map(cmdText => cmdText.trim()).filter(cmdText => cmdText !== '')

		let outText = ''
		let commentStarted = false
		for (const cmdText of cmdTexts) {
			if (cmdText === '(') {
				commentStarted = true
				continue
			}

			if (cmdText === ':') {
				if (this.colonDef)
					return {status: Status.Fail, value: `${cmdText} Colon definition already started`}

				this.colonDef = {name: '', comment: '', content: []}
				continue
			}

			if (this.colonDef) {
				if (this.colonDef.name === '') {
					this.colonDef.name = cmdText
					continue
				}

				if (cmdText === ';') {
					if (this.colonDef.name === '')
						return {status: Status.Fail, value: `${inputText} Attempt to use zero-length string as a name`}

					this.colonWords[this.colonDef.name] = this.colonDef
					this.colonDef = undefined
					continue
				}

				if (cmdText === ')' || cmdText.endsWith(')')) {
					commentStarted = false
					continue
				}

				if (commentStarted) {
					this.colonDef.comment += cmdText
					continue
				}

				this.colonDef.content.push(cmdText)
				continue
			}

			if (commentStarted) {
				continue
			}

			if (cmdText === ')' || cmdText.endsWith(')')) {
				commentStarted = false
				continue
			}

			const res: ExecResult = this.execute(cmdText)

			if (res.status === Status.Fail)
				return {status: Status.Fail, value: `${inputText} ${res.value}`}

			outText += res.value
		}

		return {status: Status.Ok, value: outText}
	}

	public getStack()
	{
		return this.stack.slice()
	}

	public getWords()
	{
		return Object.keys(this.knownWords).map(key => this.knownWords[key])
	}

	private clearStack()
	{
		while (this.stack.length > 0)
			this.stack.pop()
	}

	private execute(cmdText: string): ExecResult
	{
		const cmd: Command = this.parse(cmdText)

		switch (cmd.kind) {
			case Kind.Number:
				this.stack.push(cmd.value as number)
				return {status: Status.Ok, value: ''}
			case Kind.Word:
				return this.executeWord(cmdText, cmd.value)
			case Kind.ColonDef:
				return this.manageInputText(cmd.value as string)
			case Kind.Unknown:
				return {status: Status.Fail, value: `${cmdText} ?`}
			default:
				return {status: Status.Fail, value: `${cmdText} ?`}
		}
	}

	private parse(cmdText: string): Command
	{
		if (this.knownWords.hasOwnProperty(cmdText))
			return this.knownWords[cmdText]

		if (this.colonWords.hasOwnProperty(cmdText)) {
			const value = this.colonWords[cmdText].content.join(' ')
			return {kind: Kind.ColonDef, value, see: value}
		}

		if (cmdText.match(/[+-]?\d+/)) {
			const value =  parseInt(cmdText)
			return {kind: Kind.Number, value, see: String(value)}
		}

		if (cmdText.match(/[+-]?\d+.\d+/)) {
			const value =  parseFloat(cmdText)
			return {kind: Kind.Number, value, see: String(value)}
		}

		return {kind: Kind.Unknown, value: `${cmdText} ?`, see: ''}
	}

	private getKnownWords(): {[name: string]: Command}
	{
		return {
			'.'    : {kind: Kind.Word, value: '.',     see: 'dot   ( n -- ) - Display n in free field format.'},
			'.s'   : {kind: Kind.Word, value: '.s',    see: 'dot-s ( -- ) - Display the stack in free field format.'},

			':'    : {kind: Kind.Word, value: ':',     see: 'colon ( name -- colon-sys ) - Create a definition for name.'},
			';'    : {kind: Kind.Word, value: ';',     see: 'semicolon ( colon-sys -- ) - Terminate a colon-definition.'},
			'('    : {kind: Kind.Word, value: '(',     see: 'paren ( comment -- ) - Start a comment.'},
			')'    : {kind: Kind.Word, value: ')',     see: 'paren ( comment -- ) - Terminate a comment.'},

			'+'    : {kind: Kind.Word, value: '+',     see: 'plus  ( n1 n2 -- n3 ) - Add n2 to n1, giving the sum n3.'},
			'-'    : {kind: Kind.Word, value: '-',     see: 'minus ( n1 n2 -- n3 ) - Subtract n2 from n1 , giving the difference n3.'},
			'*'    : {kind: Kind.Word, value: '*',     see: 'start ( n1 n2 -- n3 ) - Multiply n1 by n2 giving the product n3.'},
			'/'    : {kind: Kind.Word, value: '/',     see: 'slash ( n1 n2 -- n3 ) - Divide n1 by n2, giving the single-cell quotient n3.'},

			'='    : {kind: Kind.Word, value: '=',     see: 'equals       ( n1 n2 -- flag ) - flag is true if and only if x1 is bit-for-bit the same as x2.'},
			'<>'   : {kind: Kind.Word, value: '<>',    see: 'not-equals   ( n1 n2 -- flag ) - flag is true if and only if x1 is not bit-for-bit the same as x2.'},
			'>'    : {kind: Kind.Word, value: '>',     see: 'greater-than ( n1 n2 -- flag ) - flag is true if and only if n1 is greater than n2.'},
			'<'    : {kind: Kind.Word, value: '<',     see: 'less-than    ( n1 n2 -- flag ) - flag is true if and only if n1 is less than n2.'},

			'abs'  : {kind: Kind.Word, value: 'abs',   see: 'abs   ( n -- u ) - Push the absolute value of n.'},
			'depth': {kind: Kind.Word, value: 'depth', see: 'depth ( -- +n ) - Push the depth of the stack.'},
			'drop' : {kind: Kind.Word, value: 'drop',  see: 'drop  ( x -- ) - Remove x from the stack.'},
			'dup'  : {kind: Kind.Word, value: 'dup' ,  see: 'dupe  ( x -- x x ) - Duplicate x.'},
			'mod'  : {kind: Kind.Word, value: 'mod',   see: 'mod   ( n1 n2 -- n3 ) - Divide n1 by n2, giving the single-cell remainder n3.'},
			'over' : {kind: Kind.Word, value: 'over',  see: 'over  ( x1 x2 -- x1 x2 x1 ) - Place a copy of x1 on top of the stack.'},
			'rot'  : {kind: Kind.Word, value: 'rot' ,  see: 'rote  ( x1 x2 x3 -- x2 x3 x1 ) - Rotate the top three stack entries.'},
			'swap' : {kind: Kind.Word, value: 'swap',  see: 'swap  ( x1 x2 -- x2 x1 ) - Exchange the top two stack items.'},
		}
	}

	private executeWord(cmdText: string, cmdValue: string | number): ExecResult
	{
		switch (cmdValue) {
			case '.':
				if (this.stack.length >= 1) {
					const a: number = this.stack.pop() as number
					return {status: Status.Ok, value: String(a)}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case '.s':
				return {status: Status.Ok, value: this.stack.join(' ')}

			case '+':
				if (this.stack.length >= 2) {
					const n2: number = this.stack.pop() as number
					const n1: number = this.stack.pop() as number
					const res: number = n1 + n2
					this.stack.push(res)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case '-':
				if (this.stack.length >= 2) {
					const n2: number = this.stack.pop() as number
					const n1: number = this.stack.pop() as number
					const res: number = n1 - n2
					this.stack.push(res)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case '*':
				if (this.stack.length >= 2) {
					const n2: number = this.stack.pop() as number
					const n1: number = this.stack.pop() as number
					const res: number = n1 * n2
					this.stack.push(res)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case '/':
				if (this.stack.length >= 2) {
					const n2: number = this.stack.pop() as number
					const n1: number = this.stack.pop() as number
					const res: number = n1 / n2
					this.stack.push(res)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case '=':
				if (this.stack.length >= 2) {
					const n2: number = this.stack.pop() as number
					const n1: number = this.stack.pop() as number
					const res: number = n1 === n2 ? this.TRUE : this.FALSE
					this.stack.push(res)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case '<>':
				if (this.stack.length >= 2) {
					const n2: number = this.stack.pop() as number
					const n1: number = this.stack.pop() as number
					const res: number = n1 !== n2 ? this.TRUE : this.FALSE
					this.stack.push(res)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case '>':
				if (this.stack.length >= 2) {
					const n2: number = this.stack.pop() as number
					const n1: number = this.stack.pop() as number
					const res: number = n1 > n2 ? this.TRUE : this.FALSE
					this.stack.push(res)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case '<':
				if (this.stack.length >= 2) {
					const n2: number = this.stack.pop() as number
					const n1: number = this.stack.pop() as number
					const res: number = n1 < n2 ? this.TRUE : this.FALSE
					this.stack.push(res)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case 'depth':
				this.stack.push(this.stack.length)
				return {status: Status.Ok, value: ''}

			case 'abs':
				if (this.stack.length > 0) {
					const n: number = this.stack.pop() as number
					this.stack.push(Math.abs(n))
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case 'drop':
				if (this.stack.length > 0) {
					this.stack.pop()
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case 'dup':
				if (this.stack.length > 0) {
					const x1: number = this.stack.pop() as number
					this.stack.push(x1)
					this.stack.push(x1)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case 'mod':
				if (this.stack.length >= 2) {
					const n2: number = this.stack.pop() as number
					const n1: number = this.stack.pop() as number
					const res: number = n1 % n2
					this.stack.push(res)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case 'over':
				if (this.stack.length >= 2) {
					const x2: number = this.stack.pop() as number
					const x1: number = this.stack.pop() as number
					this.stack.push(x1)
					this.stack.push(x2)
					this.stack.push(x1)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case 'swap':
				if (this.stack.length >= 2) {
					const x2: number = this.stack.pop() as number
					const x1: number = this.stack.pop() as number
					this.stack.push(x2)
					this.stack.push(x1)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			case 'rot':
				if (this.stack.length >= 2) {
					const x3: number = this.stack.pop() as number
					const x2: number = this.stack.pop() as number
					const x1: number = this.stack.pop() as number
					this.stack.push(x2)
					this.stack.push(x3)
					this.stack.push(x1)
					return {status: Status.Ok, value: ''}
				}
				return {status: Status.Fail, value: 'Stack underflow'}

			default:
				return {status: Status.Fail, value: `${cmdText} ?`}
		}
	}
}
