// noinspection JSUnusedGlobalSymbols
class Application
{
	private readonly forth: Forth

	private readonly screen    : HTMLElement
	private readonly outputLog : HTMLElement
	private readonly inputLine : HTMLInputElement
	private readonly importFile: HTMLInputElement
	private readonly stackView : HTMLElement
	private readonly wordsElem : HTMLElement

	private readonly OUT_BUFFER_LINES = 24
	private readonly inputBuffer: string[]

	private inputIndex  : number

	// noinspection JSUnusedGlobalSymbols
	constructor()
	{
		this.forth = new Forth(this.output.bind(this))

		this.screen      = document.getElementById('screen')      as HTMLElement
		this.outputLog   = document.getElementById('output-log')  as HTMLElement
		this.inputLine   = document.getElementById('input-line')  as HTMLInputElement
		this.importFile  = document.getElementById('import-file') as HTMLInputElement
		this.stackView   = document.getElementById('stack-view')  as HTMLElement
		this.wordsElem   = document.getElementById('dictionary')  as HTMLElement

		this.inputBuffer  = []
		this.inputIndex   = 0
		this.inputLine.addEventListener('keydown', this.inputLine_keydown.bind(this))
		this.importFile.addEventListener('change', this.importFile_change.bind(this))
		this.outputLog.innerText = ''
		this.inputLine.value     = ''
		this.stackView.innerText = this.forth.printStack()

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

			this.compileCodeLine(cmdText)
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

	public importFile_change(event: any): void
	{
		event.stopPropagation()
		event.preventDefault()

		if (event.target.files instanceof FileList) {
			for (const file of event.target.files) {
				this.readFile(file)
			}
		}

		this.importFile.value = ''
	}

	private output(text: string): void
	{
		this.outputLog.innerText = text.split('\n').slice(- this.OUT_BUFFER_LINES).join('\n')
	}

	private compileCodeLine(inputLine: string): void
	{
		if (inputLine !== '' && (this.inputBuffer.length === 0 ||
			this.inputBuffer[this.inputBuffer.length-1] !== inputLine)) {
			this.inputBuffer.push(inputLine)
			this.inputIndex = this.inputBuffer.length - 1
		}

		this.forth.interpret(inputLine)

		this.stackView.innerText = this.forth.printStack()
	}

	private readFile(file: File): void
	{
		const isFile: boolean = file instanceof File
		if (!isFile) return

		const fileReader: FileReader = new FileReader()
		fileReader.addEventListener('load', this.fileReader_load.bind(this, file.name), false)
		fileReader.readAsText(file, 'ascii')
	}

	private fileReader_load(fileName: string, event: any): void
	{
		event.stopPropagation()
		event.preventDefault()

		event.target.removeEventListener('load', this.fileReader_load)

		try {
			this.outputLog.innerText += `${fileName} File loaded\n`
			this.output(this.outputLog.innerText)

			const codeLines = event.target.result.split(/\r?\n/g)

			for (const codeLine of codeLines)
				this.compileCodeLine(codeLine)
		}
		catch (error: any) {
			this.outputLog.innerText += `${fileName} ${(error as Error).message}\n`
			this.output(this.outputLog.innerText)
		}
	}
}
