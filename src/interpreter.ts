class Interpreter
{
	private readonly TRUE  = -1
	private readonly FALSE =  0

	private readonly dStack: Stack
	private readonly rStack: Stack
	private readonly output: (text: string) => void

	private runMode: RunMode
	private tempColonDef: ColonDef
	private isLeaveActivated: boolean

	constructor(capacity: number, output: (text: string) => void)
	{
		this.dStack = new Stack(capacity)
		this.rStack = new Stack(capacity)
		this.output = output
		this.runMode = RunMode.Interpret
		this.isLeaveActivated = false
		this.tempColonDef = {name  : '', tokens: []}
	}

	public interpret(tokens: Token[], lineText: string): void
	{
		let outText = ''

		try {
			for (let i = 0; i < tokens.length; i += 1) {
				const token = tokens[i]

				if (this.runMode === RunMode.Interpret) {
					switch (token.kind) {
						case TokenKind.Number:
							this.dStack.push(parseInt(token.value))
							break

						case TokenKind.Comment:
						case TokenKind.LineComment:
						case TokenKind.String:
							break

						case TokenKind.Keyword: {
							const wordName = token.value.toUpperCase()

							if (wordName === ':') {
								if (i === tokens.length-1 ||
									tokens[i+1].kind !== TokenKind.Word ||
									tokens[i+1].value === ';') {
									this.die(lineText, token.value + ' Empty definition name')
									return
								}

								this.tempColonDef = {
									name  :  tokens[i+1].value.toUpperCase(),
									tokens: []
								}

								i += 1 // Eat def name
								this.runMode = RunMode.Compile
								continue
							}

							if (Dictionary.CompileOnlyWords.includes(wordName)) {
								this.die(lineText, token.value + ' No Interpretation')
								return
							}

							if (!this.keyword.hasOwnProperty(wordName)) {
								this.die(lineText, token.value + ' Unknown keyword')
								return
							}

							const res = this.keyword[wordName]()
							outText += res.value
							if (res.status === Status.Fail) {
								this.die(lineText, outText)
								return
							}

							break
						}

						case TokenKind.Word: {
							const wordName = token.value.toUpperCase()
							if (!this.colonDef.hasOwnProperty(wordName)) {
								this.die(lineText, token.value + ' Unknown word')
								return
							}

							this.runMode = RunMode.Run

							const res = this.runTokens(this.colonDef[wordName].tokens)

							this.runMode = RunMode.Interpret
							outText += res.value
							if (res.status === Status.Fail) {
								this.die(lineText, outText)
								return
							}

							break
						}

						default:
							this.die(lineText, token.value + ' Unknown word')
							return
					}
				}
				else if (this.runMode === RunMode.Compile) {
					if (token.value === ':') {
						this.die(lineText, token.value + ' Nested definition')
						return
					}

					if (token.value === ';') {
						this.colonDef[this.tempColonDef.name] = {
							name  : this.tempColonDef.name,
							tokens: this.tempColonDef.tokens.slice()
						}
						this.tempColonDef = {name  : '', tokens: []}
						this.runMode = RunMode.Interpret
						continue
					}

					if (token.kind === TokenKind.Comment &&
						i > 0 && tokens[i-1].value === '.(') {
						outText += token.value
						continue
					}

					if (token.kind === TokenKind.LineComment ||
						token.kind === TokenKind.Comment) {
						continue
					}

					this.tempColonDef.tokens.push(token)
				}
				else if (this.runMode === RunMode.Run) {
					this.die(lineText, token.value + ' You should not be in Run mode here')
					return
				}
			}
		}
		catch (e: any) {
			this.die(lineText, e.message)
			return
		}

		if (this.runMode === RunMode.Interpret)
			this.output(`${lineText} ${outText === '' ? '' : outText + ' '} ok\n`)
		else
			this.output(`${lineText} ${outText === '' ? '' : outText + ' '} compiling\n`)
	}

	public getStack()
	{
		const depth = this.dStack.depth()
		const stack = Array(depth)

		for(let i = 0; i < depth; i += 1)
			stack[depth - i] = this.dStack.get(i)

		return stack
	}

	private runTokens(tokens: Token[]): ExecResult
	{
		let outText = ''

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]
			switch (token.kind) {
				case TokenKind.Number:
					this.dStack.push(parseInt(token.value))
					break

				case TokenKind.Comment:
				case TokenKind.LineComment:
					break

				case TokenKind.String:
					outText += token.value
					break

				case TokenKind.Keyword: {
					const wordName = token.value.toUpperCase()

					if (this.isLeaveActivated)
						break

					if (wordName === 'IF') {
						let thenIndex = i + 1
						while (true) {
							thenIndex += 1
							if (thenIndex === tokens.length)
								return {status: Status.Fail, value: ' THEN not found'}
							if (tokens[thenIndex].value.toUpperCase() === 'THEN')
								break
						}

						let elseIndex = i + 1
						while (elseIndex < thenIndex) {
							elseIndex += 1
							if (tokens[elseIndex].value.toUpperCase() === 'ELSE')
								break
						}

						const flag = this.dStack.pop()
						if (flag === 0) {

							if (elseIndex < thenIndex) {
								const res = this.runTokens(tokens.slice(elseIndex+1, thenIndex))
								outText += res.value

								if (res.status === Status.Fail)
									return {status: Status.Fail, value: outText}
							}

							i = thenIndex + 1
							continue
						}
						else {
							const res = this.runTokens(tokens.slice(i+1, elseIndex))
							outText += res.value

							if (res.status === Status.Fail)
								return {status: Status.Fail, value: outText}

							i = thenIndex + 1
							continue
						}
					}

					if (wordName === 'DO') {
						let loopIndex = i + 1
						let doDepth = 1
						while (true) {
							loopIndex += 1
							if (loopIndex === tokens.length)
								return {status: Status.Fail, value: ' LOOP not found'}
							const loopWord = tokens[loopIndex].value.toUpperCase()
							if (loopWord === 'DO')
								doDepth += 1
							if (loopWord === 'LOOP' || loopWord === '+LOOP')
								doDepth -= 1
							if (doDepth === 0)
								break
						}
						const isPlusLoop = tokens[loopIndex].value.toUpperCase() === '+LOOP'
						let   counter    = this.dStack.pop()
						const limit      = this.dStack.pop()
						const upwards    = limit > counter

						if (!isPlusLoop && !upwards)
							return {status: Status.Fail, value: ' LOOP wrong range'}

						while (upwards ? counter < limit : counter >= limit) {
							this.rStack.push(counter)
							const res = this.runTokens(tokens.slice(i+1, loopIndex))
							this.rStack.pop()

							if (this.isLeaveActivated)
								break

							outText += res.value
							if (res.status === Status.Fail)
								return {status: Status.Fail, value: outText}

							counter += isPlusLoop ? this.dStack.pop() : 1
						}
						i = loopIndex
						this.isLeaveActivated = false
						continue
					}

					if (!this.keyword.hasOwnProperty(wordName))
						return {status: Status.Fail, value: token.value + ' Unknown keyword'}

					const res = this.keyword[wordName]()
					outText += res.value

					if (res.status === Status.Fail)
						return {status: Status.Fail, value: outText}
					break
				}

				case TokenKind.Word: {
					const wordName = token.value.toUpperCase()
					if (!this.colonDef.hasOwnProperty(wordName))
						return {status: Status.Fail, value: token.value + ' Unknown word'}

					const res = this.runTokens(this.colonDef[wordName].tokens)
					outText += res.value

					if (res.status === Status.Fail)
						return {status: Status.Fail, value: outText}
					break
				}

				default:
					throw new Error('Interpreter: Unreachable')
			}
		}

		return {status: Status.Ok, value: outText}
	}

	private die(lineText: string, message: string): void
	{
		this.dStack.clear()
		this.rStack.clear()
		this.output(`${lineText} ${message}\n`)
		this.runMode = RunMode.Interpret
		this.isLeaveActivated = false
	}

	private readonly colonDef: {[word: string]: ColonDef} = {}

	private readonly keyword: {[word: string]: () => ExecResult} = {
		// Comments

		'(': () => {
			return {status: Status.Ok, value: ''}
		},

		'.(': () => {
			return this.runMode === RunMode.Interpret
				? {status: Status.Fail, value: ' No Interpretation'}
				: {status: Status.Ok, value: ''}
		},

		'\\': () => {
			return {status: Status.Ok, value: ''}
		},

		// String

		'."': () => {
			return this.runMode === RunMode.Interpret
				? {status: Status.Fail, value: ' No Interpretation'}
				: {status: Status.Ok, value: ''}
		},

		// Output

		'CR': () => {
			return {status: Status.Ok, value: '\n'}
		},

		'EMIT': () => {
			const charCode = this.dStack.pop()
			this.output(String.fromCharCode(charCode))
			return {status: Status.Ok, value: ''}
		},

		'SPACE': () => {
			return {status: Status.Ok, value: ' '}
		},

		'SPACES': () => {
			const count = this.dStack.pop()
			return {status: Status.Ok, value: ' '.repeat(count)}
		},

		// Numbers

		'+': () => {
			const n2 = this.dStack.pop()
			const n1 = this.dStack.pop()
			this.dStack.push(n1 + n2)
			return {status: Status.Ok, value: ''}
		},

		'-': () => {
			const n2 = this.dStack.pop()
			const n1 = this.dStack.pop()
			this.dStack.push(n1 - n2)
			return {status: Status.Ok, value: ''}
		},

		'*': () => {
			const n2 = this.dStack.pop()
			const n1 = this.dStack.pop()
			this.dStack.push(n1 * n2)
			return {status: Status.Ok, value: ''}
		},

		'/': () => {
			const n2 = this.dStack.pop()
			const n1 = this.dStack.pop()
			this.dStack.push(n1 / n2)
			return {status: Status.Ok, value: ''}
		},

		'ABS': () => {
			const n1 = this.dStack.pop()
			this.dStack.push(Math.abs(n1))
			return {status: Status.Ok, value: ''}
		},

		// Stack manipulation

		'.': () => {
			return {status: Status.Ok, value: this.dStack.pop().toString()}
		},

		'DEPTH': () => {
			this.dStack.push(this.dStack.depth())
			return {status: Status.Ok, value: ''}
		},

		'DUP': () => {
			this.dStack.push(this.dStack.get(0))
			return {status: Status.Ok, value: ''}
		},

		'OVER': () => {
			this.dStack.push(this.dStack.get(1))
			return {status: Status.Ok, value: ''}
		},

		'DROP': () => {
			this.dStack.pop()
			return {status: Status.Ok, value: ''}
		},

		'SWAP': () => {
			const n2 = this.dStack.pop()
			const n1 = this.dStack.pop()
			this.dStack.push(n2)
			this.dStack.push(n1)
			return {status: Status.Ok, value: ''}
		},

		'ROT': () => {
			const n3 = this.dStack.pop()
			const n2 = this.dStack.pop()
			const n1 = this.dStack.pop()
			this.dStack.push(n2)
			this.dStack.push(n3)
			this.dStack.push(n1)
			return {status: Status.Ok, value: ''}
		},

		// Comparison

		'=': () => {
			const n2 = this.dStack.pop()
			const n1 = this.dStack.pop()
			this.dStack.push(n1 === n2 ? this.TRUE : this.FALSE)
			return {status: Status.Ok, value: ''}
		},

		'<>': () => {
			const n2 = this.dStack.pop()
			const n1 = this.dStack.pop()
			this.dStack.push(n1 !== n2 ? this.TRUE : this.FALSE)
			return {status: Status.Ok, value: ''}
		},

		'>': () => {
			const n2 = this.dStack.pop()
			const n1 = this.dStack.pop()
			this.dStack.push(n1 > n2 ? this.TRUE : this.FALSE)
			return {status: Status.Ok, value: ''}
		},

		'<': () => {
			const n2 = this.dStack.pop()
			const n1 = this.dStack.pop()
			this.dStack.push(n1 < n2 ? this.TRUE : this.FALSE)
			return {status: Status.Ok, value: ''}
		},

		// DO

		'I': () => {
			this.dStack.push( this.rStack.get(0) )
			return {status: Status.Ok, value: ''}
		},

		'J': () => {
			this.dStack.push( this.rStack.get(1) )
			return {status: Status.Ok, value: ''}
		},

		'LEAVE': () => {
			this.isLeaveActivated = true
			return {status: Status.Ok, value: ''}
		},

		// Tools

		'.S': () => {
			return {status: Status.Ok, value: this.getStack().join(' ') + ' < Top'}
		},
	}
}
