class Forth
{
	private readonly MEMORY_CAPACITY = 1_000_000
	private readonly STACK_CAPACITY  = 1024
	private readonly env: Environment
	private readonly output: (text: string) => void

	constructor(output: (text: string) => void)
	{
		this.output = output

		this.env = {
			inputBuffer : '',
			outputBuffer: '',
			runMode     : RunMode.Interpret,
			isLeave     : false,
			dStack      : new Stack(this.STACK_CAPACITY),
			rStack      : new Stack(this.STACK_CAPACITY),
			memory      : new Memory(this.MEMORY_CAPACITY),
			tempDef     : {name: '', tokens: []},
		}
	}

	public interpret(inputLine: string): void
	{
		this.env.inputBuffer   = inputLine + ' '
		this.env.outputBuffer += this.env.inputBuffer

		try {
			const radix = this.env.memory.fetchCell( this.env.memory.base() )
			const tokens: Token[] = Parser.parseLine(this.env.inputBuffer, radix)

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
		}
		catch (e: any) {
			this.die(e.message)
			return
		}

		if (this.env.runMode === RunMode.Interpret)
			this.env.outputBuffer += ' ok'
		this.env.outputBuffer += '\n'
		this.output(this.env.outputBuffer)
	}

	public printStack()
	{
		const radix = this.env.memory.fetchCell( this.env.memory.base() )
		return this.env.dStack.print()
			.map( (n: number) => Number.isInteger(n) ? n.toString(radix).toUpperCase() : String(n))
			.join(' ') + ' <- Top'
	}

	private die(message: string): void
	{
		this.env.dStack.clear()
		this.env.rStack.clear()
		this.env.runMode = RunMode.Interpret
		this.env.isLeave = false

		this.env.outputBuffer += message + '\n'
		this.output(this.env.outputBuffer)
	}
}
