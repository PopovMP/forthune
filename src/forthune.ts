class Forthune
{
	private readonly stack: number[]
	private readonly dictionary: {[name: string]: Command}

	public output = (_text :string) => {}

	constructor()
	{
		this.stack = []
		this.dictionary = this.getKnownWords()
	}

	public manageInput(inputText: string): void
	{
		const cmdTexts = inputText.split(/[ \t]/).map(cmdText => cmdText.trim()).filter(cmdText => cmdText !== '')

		let outText = ''
		for (const cmdText of cmdTexts) {
			const res: ExecResult = this.execute(cmdText)

			if (res.status === Status.Fail) {
				while (this.stack.length > 0)
					this.stack.pop()
				this.output(`${cmdText} ${res.value}`)
				return
			}

			outText += res.value
		}

		this.output(`${inputText} ${outText}  ok`)
	}

	public getStack()
	{
		return this.stack.slice()
	}

	public getWords()
	{
		return Object.keys(this.dictionary).map(key => this.dictionary[key])
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
			case Kind.Unknown:
				return {status: Status.Fail, value: `${cmdText} ?`}
			default:
				return {status: Status.Fail, value: `${cmdText} ?`}
		}
	}

	private parse(cmdText: string): Command
	{
		if (this.dictionary.hasOwnProperty(cmdText))
			return this.dictionary[cmdText]

		if (cmdText.match(/[+-]?\d+/)) {
			const value =  parseInt(cmdText)
			return {kind: Kind.Number, value: value, see: String(value) }
		}

		if (cmdText.match(/[+-]?\d+.\d+/)) {
			const value =  parseFloat(cmdText)
			return {kind: Kind.Number, value: value, see: String(value) }
		}

		return {kind: Kind.Unknown, value: `${cmdText} ?`, see: ''}
	}

	private getKnownWords(): {[name: string]: Command}
	{
		return {
			'.'    : {kind: Kind.Word, value: '.',     see: 'dot ( n -- ) - Display n in free field format.'},
			'+'    : {kind: Kind.Word, value: '+',     see: 'plus ( n1 n2 -- n3 ) - Add n2 to n1, giving the sum n3.'},
			'-'    : {kind: Kind.Word, value: '-',     see: 'minus ( n1 n2 -- n3 ) - Subtract n2 from n1 , giving the difference n3.'},
			'*'    : {kind: Kind.Word, value: '*',     see: 'start ( n1 n2 -- n3 ) - Multiply n1 by n2 giving the product n3.'},
			'/'    : {kind: Kind.Word, value: '/',     see: 'slash ( n1 n2 -- n3 ) - Divide n1 by n2, giving the single-cell quotient n3.'},
			'abs'  : {kind: Kind.Word, value: 'abs',   see: 'abs ( n -- u ) - Push the absolute value of n.'},
			'depth': {kind: Kind.Word, value: 'depth', see: 'depth ( -- +n ) - Push the depth of the stack.'},
			'drop' : {kind: Kind.Word, value: 'drop',  see: 'drop ( x -- ) - Remove x from the stack.'},
			'dup'  : {kind: Kind.Word, value: 'dup' ,  see: 'dupe ( x -- x x ) - Duplicate x.'},
			'mod'  : {kind: Kind.Word, value: 'mod',   see: 'mod ( n1 n2 -- n3 ) - Divide n1 by n2, giving the single-cell remainder n3.'},
			'over' : {kind: Kind.Word, value: 'over',  see: 'over ( x1 x2 -- x1 x2 x1 ) - Place a copy of x1 on top of the stack.'},
			'rot'  : {kind: Kind.Word, value: 'rot' ,  see: 'rote ( x1 x2 x3 -- x2 x3 x1 ) - Rotate the top three stack entries.'},
			'swap' : {kind: Kind.Word, value: 'swap',  see: 'swap ( x1 x2 -- x2 x1 ) - Exchange the top two stack items.'},
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
