class Forth
{
	private readonly STACK_CAPACITY   = 1024
	private readonly env: Environment

	constructor(output: (text: string) => void)
	{
		this.env = {
			runMode: RunMode.Interpret,
			isLeave: false,
			dStack : new Stack(this.STACK_CAPACITY),
			rStack : new Stack(this.STACK_CAPACITY),
			tempDef: {name: '', tokens: []},
			output,
		}
	}

	public run(tokens: Token[], lineText: string): void
	{
		let outText = ''

		try {
			for (let i = 0; i < tokens.length; i += 1) {
				const token = tokens[i]

				switch (this.env.runMode) {
					case RunMode.Interpret: {
						const res = Interpreter.run(tokens, i, this.env)
						outText += res.value
						if (res.status === Status.Fail) {
							this.die(lineText, outText)
							return
						}

						// Increment i because the definition name is eaten by Interpreter
						if (token.value === ':')
							i += 1

						break
					}

					case RunMode.Compile: {
						const res = Compiler.compile(tokens, i, this.env)
						outText += res.value
						if (res.status === Status.Fail) {
							this.die(lineText, outText)
							return
						}
						break
					}

					case RunMode.Run:
						this.die(lineText, token.value + '  You should not be in Run mode here')
						return
				}
			}
		}
		catch (e: any) {
			this.die(lineText, e.message)
			return
		}

		const status  = this.env.runMode === RunMode.Interpret ? 'ok' : 'compiling'
		const message = outText === '' ? '' : outText.endsWith(' ') ? outText : outText + ' '

		this.env.output(`${lineText} ${message} ${status}\n`)
	}

	public printStack()
	{
		return this.env.dStack.print()
	}

	private die(lineText: string, message: string): void
	{
		this.env.dStack.clear()
		this.env.rStack.clear()
		this.env.output(`${lineText} ${message}\n`)
		this.env.runMode = RunMode.Interpret
		this.env.isLeave = false
	}
}
