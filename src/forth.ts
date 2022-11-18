class Forth
{
	private readonly STACK_CAPACITY = 1024
	private readonly env: Environment

	constructor(output: (text: string) => void)
	{
		this.env = {
			runMode : RunMode.Interpret,
			isLeave : false,
			dStack  : new Stack(this.STACK_CAPACITY),
			rStack  : new Stack(this.STACK_CAPACITY),
			value   : {},
			constant: {},
			tempDef : {name: '', tokens: []},
			output  : output,
		}
	}

	public run(tokens: Token[], lineText: string): void
	{
		let outText = ''

		try {
			for (let i = 0; i < tokens.length; i += 1) {
				const token = tokens[i]

				if (token.error) {
					outText += ` ${token.value}  ${token.error}`
					this.die(lineText, outText)
					return
				}

				if (this.env.runMode === RunMode.Run) {
					this.die(lineText, token.value + ' No Run mode allowed here')
					return
				}

				const res = this.env.runMode === RunMode.Interpret
					? Interpreter.run(tokens, i, this.env)
					: Compiler.compile(tokens, i, this.env)

				outText += res.value

				if (res.status === Status.Fail) {
					this.die(lineText, outText)
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
