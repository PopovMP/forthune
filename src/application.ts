// noinspection JSUnusedGlobalSymbols
class Application
{
	private readonly forthune  : Forthune
	private readonly screen    : HTMLElement
	private readonly outputLog : HTMLElement
	private readonly inputLine : HTMLInputElement
	private readonly stackView : HTMLElement
	private readonly wordsElem : HTMLElement

	private readonly OUT_BUFFER_LINES = 23
	private readonly outputBuffer: string[]
	private readonly readBuffer: string[]

	private readBufferIndex: number

	// noinspection JSUnusedGlobalSymbols
	constructor()
	{
		this.forthune   = new Forthune()
		this.screen     = document.getElementById('screen')     as HTMLElement
		this.outputLog  = document.getElementById('output-log') as HTMLElement
		this.inputLine  = document.getElementById('input-line') as HTMLInputElement
		this.stackView  = document.getElementById('stack-view') as HTMLElement
		this.wordsElem  = document.getElementById('dictionary') as HTMLElement
		this.readBuffer = []
		this.outputBuffer = []
		this.readBufferIndex = 0
		this.inputLine.addEventListener("keydown", this.readline_keydown.bind(this))
		this.forthune.output = this.output.bind(this)
		this.outputLog.innerText = ''
		this.inputLine.value = ''
		this.stackView.innerText = ' <top'

		this.outputLog.addEventListener('click', () => this.inputLine.focus())
		this.screen.addEventListener('click', () => this.inputLine.focus())
		this.inputLine.focus()
		this.wordsElem.innerHTML = this.forthune.getWords()
			.map(word => `<strong>${word.value.toString().padEnd(5, ' ').replace(/ /g, '&nbsp;')}</strong> ${word.see}`)
			.join('<br/>')
		document.addEventListener('click', () => this.inputLine.focus())
	}

	public readline_keydown(event: KeyboardEvent): void
	{
		if (event.code === 'Enter') {
			event.preventDefault()

			const cmdText = this.inputLine.value.trim()
			this.inputLine.value = ''

			if (this.readBuffer.length === 0 || this.readBuffer[this.readBuffer.length-1] !== cmdText) {
				this.readBuffer.push(cmdText)
				this.readBufferIndex = this.readBuffer.length - 1
			}

			this.forthune.manageInput(cmdText)
			this.stackView.innerText = this.forthune.getStack().join(' ') +  ' <top'

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
