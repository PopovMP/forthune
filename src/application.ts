// noinspection JSUnusedGlobalSymbols
class Application
{
	private readonly forthune  : Forthune
	private readonly readline  : HTMLInputElement
	private readonly terminal  : HTMLTextAreaElement
	private readonly stackView : HTMLElement
	private readonly wordsElem : HTMLElement
	private readonly readBuffer: string[]

	private readBufferIndex: number

	// noinspection JSUnusedGlobalSymbols
	constructor()
	{
		this.forthune   = new Forthune()
		this.readline   = document.getElementById('readline') as HTMLInputElement
		this.terminal   = document.getElementById('terminal') as HTMLTextAreaElement
		this.stackView  = document.getElementById('stack-view') as HTMLElement
		this.wordsElem  = document.getElementById('dictionary') as HTMLElement
		this.readBuffer = []
		this.readBufferIndex = 0
		this.readline.addEventListener("keydown", this.readline_keydown.bind(this))
		this.forthune.output = this.output.bind(this)
		this.terminal.value = ''
		this.readline.value = ''
		this.stackView.innerText = ' <top'

		this.wordsElem.innerHTML = this.forthune.getWords()
			.map(word => `<strong>${word.value.toString().padEnd(5, ' ').replace(/ /g, '&nbsp;')}</strong> ${word.see}`)
			.join('<br/>')
	}

	public readline_keydown(event: KeyboardEvent): void
	{
		if (event.code === 'Enter') {
			event.preventDefault()

			const cmdText = this.readline.value.trim()
			this.readline.value = ''

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
				this.readline.value = this.readBuffer[this.readBufferIndex]
			if (this.readBufferIndex > 0)
				this.readBufferIndex -= 1
		}

		if (event.code === 'ArrowDown') {
			event.preventDefault()

			if (this.readBufferIndex < this.readBuffer.length - 1) {
				this.readBufferIndex += 1
				this.readline.value = this.readBuffer[this.readBufferIndex]
			}
		}
	}

	private output(text: string): void
	{
		this.terminal.value += text + '\n'
		this.terminal.scrollTop = this.terminal.scrollHeight;
	}
}
