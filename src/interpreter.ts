class Interpreter
{
	private readonly dStack: Stack
	private readonly rStack: Stack
	private readonly output: (text: string) => void

	private runMode: RunMode
	private tempColonDef: ColonDef
	private isLeave: boolean

	constructor(capacity: number, output: (text: string) => void)
	{
		this.dStack = new Stack(capacity)
		this.rStack = new Stack(capacity)
		this.output = output
		this.runMode = RunMode.Interpret
		this.isLeave = false

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

						case TokenKind.Character:
							this.dStack.push(token.value.charCodeAt(0))
							break

						case TokenKind.Comment:
						case TokenKind.LineComment:
						case TokenKind.String:
							break

						case TokenKind.Word: {
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

							if (Dictionary.words.hasOwnProperty(wordName)) {
								const env = {runMode: this.runMode, dStack: this.dStack, rStack: this.rStack}
								const res = Dictionary.words[wordName](env)
								outText += res.value
								if (res.status === Status.Fail) {
									this.die(lineText, outText)
									return
								}
								break
							}

							if (Dictionary.colonDef.hasOwnProperty(wordName)) {
								this.runMode = RunMode.Run
								const res = this.runTokens(Dictionary.colonDef[wordName].tokens)
								this.runMode = RunMode.Interpret
								outText += res.value
								if (res.status === Status.Fail) {
									this.die(lineText, outText)
									return
								}
								break
							}

							this.die(lineText, token.value + '  Unknown word')
							return
						}

						default:
							this.die(lineText, token.value + ' Interpret mode: Unreachable')
							return
					}
				}
				else if (this.runMode === RunMode.Compile) {
					if (token.value === ':') {
						this.die(lineText, token.value + ' Nested definition')
						return
					}

					if (token.value === ';') {
						Dictionary.colonDef[this.tempColonDef.name] = {
							name  : this.tempColonDef.name,
							tokens: this.tempColonDef.tokens.slice()
						}
						this.tempColonDef = {name  : '', tokens: []}
						this.runMode = RunMode.Interpret
						continue
					}

					if (token.kind === TokenKind.Comment && i > 0 && tokens[i-1].value === '.(') {
						outText += token.value
						continue
					}

					switch (token.kind) {
						case TokenKind.Comment:
						case TokenKind.LineComment:
							break
						case TokenKind.Number:
						case TokenKind.Character:
						case TokenKind.String:
							this.tempColonDef.tokens.push(token)
							break
						case TokenKind.Word:
							const wordName = token.value.toUpperCase()

							if (Dictionary.words.hasOwnProperty(wordName)) {
								this.tempColonDef.tokens.push(token)
								break
							}

							if (Dictionary.colonDef.hasOwnProperty(wordName)) {
								this.tempColonDef.tokens.push(token)
								break
							}

							this.die(lineText, token.value + '  Unknown word')
							return

						default:
							this.die(lineText, token.value + '  Compile mode: Unreachable')
							return
					}
				}
				else if (this.runMode === RunMode.Run) {
					this.die(lineText, token.value + '  You should not be in Run mode here')
					return
				}
			}
		}
		catch (e: any) {
			this.die(lineText, e.message)
			return
		}

		const status  = this.runMode === RunMode.Interpret ? 'ok' : 'compiling'
		const message = outText === '' ? '' : outText.endsWith(' ') ? outText : outText + ' '

		this.output(`${lineText} ${message} ${status}\n`)
	}

	public printStack()
	{
		return this.dStack.print()
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

				case TokenKind.Character:
					this.dStack.push(token.value.charCodeAt(0))
					break

				case TokenKind.String:
					outText += token.value
					break

				case TokenKind.Word:
					const wordName = token.value.toUpperCase()

					if (this.isLeave)
						break

					if (wordName === 'IF') {
						let thenIndex = i + 1
						let ifDepth = 1
						while (true) {
							thenIndex += 1
							if (thenIndex === tokens.length)
								return {status: Status.Fail, value: ' THEN not found'}
							const loopWord = tokens[thenIndex].value.toUpperCase()
							if (loopWord === 'IF')
								ifDepth += 1
							if (loopWord === 'THEN')
								ifDepth -= 1
							if (ifDepth === 0)
								break
						}

						let elseIndex = i + 1
						ifDepth = 1
						while (elseIndex < thenIndex) {
							elseIndex += 1
							const loopWord = tokens[elseIndex].value.toUpperCase()
							if (loopWord === 'IF')
								ifDepth += 1
							if (loopWord === 'THEN')
								ifDepth -= 1
							if (ifDepth === 1 && loopWord === 'ELSE')
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

					if (wordName === 'DO' || wordName === '?DO') {
						const isQuestionDup = wordName === '?DO'
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

						if (isQuestionDup && counter === limit) {
							i = loopIndex
							this.isLeave = false
							continue
						}

						if (!isPlusLoop && !upwards)
							return {status: Status.Fail, value: ' LOOP wrong range'}

						while (upwards ? counter < limit : counter >= limit) {
							this.rStack.push(counter)
							const res = this.runTokens(tokens.slice(i+1, loopIndex))
							this.rStack.pop()

							if (this.isLeave)
								break

							outText += res.value
							if (res.status === Status.Fail)
								return {status: Status.Fail, value: outText}

							counter += isPlusLoop ? this.dStack.pop() : 1
						}

						i = loopIndex
						this.isLeave = false
						continue
					}

					if (Dictionary.words.hasOwnProperty(wordName) ) {
						const env = {runMode: this.runMode, dStack: this.dStack, rStack: this.rStack}
						const res = Dictionary.words[wordName](env)
						outText += res.value
						if (res.status === Status.Fail)
							return {status: Status.Fail, value: outText}
						if (wordName === 'LEAVE') {
							this.isLeave = true
							return {status: Status.Ok, value: outText}
						}
						break
					}

					if (Dictionary.colonDef.hasOwnProperty(wordName)) {
						const res = this.runTokens(Dictionary.colonDef[wordName].tokens)
						outText += res.value
						if (res.status === Status.Fail)
							return {status: Status.Fail, value: outText}
						break
					}

					return {status: Status.Fail, value: `${outText} ${token.value}  Unknown word`}

				default:
					throw new Error('runTokens:  Unreachable')
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
		this.isLeave = false
	}
}
