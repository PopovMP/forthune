// noinspection JSUnusedGlobalSymbols
class Application
{
	private readonly interpreter: Interpreter
	private readonly screen    : HTMLElement
	private readonly outputLog : HTMLElement
	private readonly inputLine : HTMLInputElement
	private readonly stackView : HTMLElement
	private readonly wordsElem : HTMLElement

	private readonly OUT_BUFFER_LINES = 24
	private readonly STACK_CAPACITY   = 1024
	private readonly inputBuffer: string[]

	private inputIndex  : number
	private outputBuffer: string

	// noinspection JSUnusedGlobalSymbols
	constructor()
	{
		this.interpreter = new Interpreter(this.STACK_CAPACITY, this.output.bind(this))

		this.screen     = document.getElementById('screen')     as HTMLElement
		this.outputLog  = document.getElementById('output-log') as HTMLElement
		this.inputLine  = document.getElementById('input-line') as HTMLInputElement
		this.stackView  = document.getElementById('stack-view') as HTMLElement
		this.wordsElem  = document.getElementById('dictionary') as HTMLElement

		this.inputBuffer  = []
		this.outputBuffer = ""
		this.inputIndex   = 0
		this.inputLine.addEventListener("keydown", this.inputLine_keydown.bind(this))
		this.outputLog.innerText = ''
		this.inputLine.value     = ''
		this.stackView.innerText = ' < Top'

		this.outputLog.addEventListener('click', () => this.inputLine.focus())
		this.screen.addEventListener('click', () => this.inputLine.focus())
		document.addEventListener('click', () => this.inputLine.focus())

		this.inputLine.focus()
	}

	public inputLine_keydown(event: KeyboardEvent): void
	{
		if (event.code === 'Enter') {
			event.preventDefault()

			const cmdText = this.inputLine.value
			this.inputLine.value = ''

			if (cmdText !== '' && (this.inputBuffer.length === 0 || this.inputBuffer[this.inputBuffer.length-1] !== cmdText)) {
				this.inputBuffer.push(cmdText)
				this.inputIndex = this.inputBuffer.length - 1
			}

			const tokens = Tokenizer.tokenizeLine(cmdText, 0)
			this.interpreter.interpret(tokens, cmdText)

			this.stackView.innerText = this.interpreter.getStack().join(' ') +  ' < Top'

			return
		}

		if (event.code === 'ArrowUp') {
			event.preventDefault()

			if (this.inputBuffer.length > 0)
				this.inputLine.value = this.inputBuffer[this.inputIndex]
			if (this.inputIndex > 0)
				this.inputIndex -= 1
		}

		if (event.code === 'ArrowDown') {
			event.preventDefault()

			if (this.inputIndex < this.inputBuffer.length - 1) {
				this.inputIndex += 1
				this.inputLine.value = this.inputBuffer[this.inputIndex]
			}
		}
	}

	private output(text: string): void
	{
		const outputText = this.outputBuffer + text
		const outSplit = outputText.split('\n')
		while (outSplit.length > this.OUT_BUFFER_LINES)
			outSplit.shift()
		this.outputBuffer = outSplit.join('\n')
		this.outputLog.innerText = this.outputBuffer
	}
}
