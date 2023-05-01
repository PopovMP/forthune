'use strict'

import {forth} from './forth.mjs'
import {dump, debug} from './dump.mjs'

export function application()
{
	const OUTPUT_LINES = 24
	const fth = forth(write.bind(this))

	const screen      = document.getElementById('screen')
	const outputLog   = document.getElementById('output-log')
	const inputLine   = document.getElementById('input-line')
	const importFile  = document.getElementById('import-file')
	const memDump     = document.getElementById('mem-dump')
	const inputBuffer = []
	let inputIndex  = 0

	inputLine.addEventListener('keydown', inputLine_keydown)
	importFile.addEventListener('change', importFile_change)
	outputLog.addEventListener('click', () => inputLine.focus())
	document.getElementById('show-dump' ).addEventListener('click', () => dump_click())
	document.getElementById('show-debug').addEventListener('click', () => debug_click())
	screen.addEventListener('click', () => inputLine.focus())
	document.addEventListener('click', () => inputLine.focus())
	inputLine.focus()
	inputLine.value     = ''
	outputLog.innerText = ''


	function inputLine_keydown(event)
	{
		switch (event.code) {
			case 'Enter':
				event.preventDefault()
				const cmdText = inputLine.value
				inputLine.value = ''
				compileCodeLine(cmdText)
				break
			case 'ArrowUp':
				event.preventDefault()
				if (inputBuffer.length > 0)
					inputLine.value = inputBuffer[inputIndex]
				if (inputIndex > 0)
					inputIndex -= 1
				break
			case 'ArrowDown':
				event.preventDefault()
				if (inputIndex < inputBuffer.length - 1) {
					inputIndex += 1
					inputLine.value = inputBuffer[inputIndex]
				}
				break
		}
	}

	function importFile_change(event)
	{
		event.stopPropagation()
		event.preventDefault()
		if (event.target.files instanceof FileList) {
			for (const file of event.target.files) {
				readFile(file)
			}
		}
		importFile.value = ''
	}

	/**
	 * Writes a character
	 * @param {number} char
	 * @return {void}
	 */
	function write(char)
	{
		if (char === 10) {
			// Line Feed
			outputLog.innerText += '\n'
		}
		else if (char === 12) {
			// Form Feed
			outputLog.innerText = ''
		}
		else if (31 < char && char < 127) {
			outputLog.innerText += String.fromCharCode(char)
		}
		else {
			throw new Error('Non-printable char code: ' + char)
		}

		outputLog.innerText = outputLog.innerText.split('\n').slice(-OUTPUT_LINES).join('\n')
	}

	function dump_click()
	{
		dump(memDump, fth.cFetch)
	}

	function debug_click()
	{
		debug(memDump, fth.cFetch, fth.fetch)
	}

	function compileCodeLine(inputLine)
	{
		if (inputLine !== '' && (inputBuffer.length === 0 || inputBuffer[inputBuffer.length-1] !== inputLine)) {
			inputBuffer.push(inputLine)
			inputIndex = inputBuffer.length - 1
		}
		fth.interpret(inputLine.replaceAll('\t', '    '))
	}

	function readFile(file)
	{
		const isFile = file instanceof File
		if (!isFile) return
		const fileReader = new FileReader()
		fileReader.addEventListener('load', fileReader_load.bind(this, file.name), false)
		fileReader.readAsText(file, 'ascii')
	}

	function fileReader_load(fileName, event)
	{
		event.stopPropagation()
		event.preventDefault()
		event.target.removeEventListener('load', fileReader_load)
		try {
			outputLog.innerText += `${fileName} File loaded\n`
			const codeLines = event.target.result.split(/\r?\n/g)
			for (const codeLine of codeLines)
				compileCodeLine(codeLine)
		}
		catch (error) {
			outputLog.innerText += `${fileName} ${error.message}\n`
		}
	}
}
