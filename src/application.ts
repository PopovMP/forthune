// noinspection JSUnusedGlobalSymbols
class Application
{
	private readonly interpreter: Interpreter
	private readonly screen    : HTMLElement
	private readonly outputLog : HTMLElement
	private readonly inputLine : HTMLInputElement
	private readonly stackView : HTMLElement
	private readonly wordsElem : HTMLElement

	private readonly OUT_BUFFER_LINES = 23
	private readonly STACK_CAPACITY   = 1024
	private readonly outputBuffer: string[]
	private readonly readBuffer: string[]

	private readBufferIndex: number

	// noinspection JSUnusedGlobalSymbols
	constructor()
	{
		this.interpreter = new Interpreter(this.STACK_CAPACITY, this.output.bind(this))

		this.screen     = document.getElementById('screen')     as HTMLElement
		this.outputLog  = document.getElementById('output-log') as HTMLElement
		this.inputLine  = document.getElementById('input-line') as HTMLInputElement
		this.stackView  = document.getElementById('stack-view') as HTMLElement
		this.wordsElem  = document.getElementById('dictionary') as HTMLElement
		this.readBuffer = []
		this.outputBuffer = []
		this.readBufferIndex = 0
		this.inputLine.addEventListener("keydown", this.readline_keydown.bind(this))
		this.outputLog.innerText = ''
		this.inputLine.value     = ''
		this.stackView.innerText = ' < Top'

		this.outputLog.addEventListener('click', () => this.inputLine.focus())
		this.screen.addEventListener('click', () => this.inputLine.focus())
		this.inputLine.focus()
		document.addEventListener('click', () => this.inputLine.focus())
	}

	public readline_keydown(event: KeyboardEvent): void
	{
		if (event.code === 'Enter') {
			event.preventDefault()

			const cmdText = this.inputLine.value
			this.inputLine.value = ''

			if (cmdText !== '' && (this.readBuffer.length === 0 || this.readBuffer[this.readBuffer.length-1] !== cmdText)) {
				this.readBuffer.push(cmdText)
				this.readBufferIndex = this.readBuffer.length - 1
			}

			const tokens = Tokenizer.tokenizeLine(cmdText, 0)
			this.interpreter.interpret(tokens, cmdText)

			this.stackView.innerText = this.interpreter.getStack().join(' ') +  ' < Top'

			return
		}

		if (event.code === 'ArrowUp') {
			event.preventDefault()

			if (this.readBuffer.length > 0)
				this.inputLine.value = this.readBuffer[this.readBufferIndex]
			if (this.readBufferIndex > 0)
				this.readBufferIndex -= 1
		}

		if (event.code === 'ArrowDown') {
			event.preventDefault()

			if (this.readBufferIndex < this.readBuffer.length - 1) {
				this.readBufferIndex += 1
				this.inputLine.value = this.readBuffer[this.readBufferIndex]
			}
		}
	}

	private output(text: string): void
	{
		this.outputBuffer.push(text)
		while (this.outputBuffer.length > this.OUT_BUFFER_LINES)
			this.outputBuffer.shift()
		this.outputLog.innerText = this.outputBuffer.join('\n')
	}
}
