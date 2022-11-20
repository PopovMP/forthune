class Forth
{
	private readonly STACK_CAPACITY    = 1024
	private readonly C_STRING_CAPACITY = 100_00
	private readonly env: Environment

	constructor(output: (text: string) => void)
	{
		this.env = {
			runMode : RunMode.Interpret,
			isLeave : false,
			dStack  : new Stack(this.STACK_CAPACITY),
			rStack  : new Stack(this.STACK_CAPACITY),
			cString : new Uint8Array(this.C_STRING_CAPACITY),
			cs      : 0,
			value   : {},
			constant: {},
			tempDef : {name: '', tokens: []},
			output  : output,
		}
	}

	public interpret(tokens: Token[]): void
	{
		try {
			for (let i = 0; i < tokens.length; i += 1) {
				const token = tokens[i]

				if (token.error) {
					this.die(`${token.value} ${token.error}`)
					return
				}

				if (this.env.runMode === RunMode.Run) {
					this.die(token.value + ' Forth: Run mode not allowed here')
					return
				}

				const res = this.env.runMode === RunMode.Interpret
					? Interpreter.run(tokens, i, this.env)
					: Compiler.compile(tokens, i, this.env)

				if (res.status === Status.Fail) {
					this.die(res.message)
					return
				}
			}

			if (this.env.runMode === RunMode.Interpret)
				this.env.output(' ok')
			this.env.output('\n')
		}
		catch (e: any) {
			this.die(e.message)
			return
		}
	}

	public printStack()
	{
		return this.env.dStack.print()
	}

	private die(message: string): void
	{
		this.env.dStack.clear()
		this.env.rStack.clear()
		this.env.output(message + '\n')
		this.env.runMode = RunMode.Interpret
		this.env.isLeave = false
	}
}
