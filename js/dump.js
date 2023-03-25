'use strict'

const WS = 8 /** word size */

const S_REG                   =      0 // Data stack pointer
const R_REG                   =      8 // Return stack pointer
const CF_REG                  =     16 // Control-flow stack pointer
const DS_REG                  =     24 // Data-space pointer
const IP_REG                  =     40 // Instruction Pointer

const TO_IN_ADDR              =     80 // Addr of input buffer pointer
const INPUT_BUFFER_CHARS_ADDR =     88
const INPUT_BUFFER_ADDR       =    120

const CURRENT_DEF_ADDR        =     96 // Name a-addr of the latest definition
const DATA_STACK_ADDR         =    376 // size 32 cells
const RET_STACK_ADDR          =    632 // size 1050 cells
const CONTROL_FLOW_ADDR       =  9_032 // size 32 cells
const PARSE_WORD_ADDR         =  9_544 // size 32 cells
const MEMORY_SIZE             = 64_000

/**
 * Dumps the VM memory
 *
 * @param {HTMLElement} memDump
 * @param {(addr: number) => number} cFetch
 * @param {(addr: number) => number} fetch
 */
function dump(memDump, cFetch, fetch)
{
	const ADDR_STEP = 16
	const lines = [		' Dec  Hex    0 1  2 3  4 5  6 7  8 9  A B  C D  E F ']
	let previousLineText = ''
	let isStar = false
	for (let lineAddr = 0; lineAddr < MEMORY_SIZE; lineAddr += ADDR_STEP) {
		let lineBytes = []
		for (let addr = lineAddr; addr < lineAddr + ADDR_STEP; addr += 2) {
			lineBytes.push(cFetch(addr))
			lineBytes.push(cFetch(addr+1))
		}
		const lineByteText = lineBytes.join('')
		if (previousLineText === lineByteText) {
			if (!isStar) {
				lines.push(
					lineAddr.toString(10).padStart(5, '0') + ' ' +
					lineAddr.toString(16).padStart(4, '0').toUpperCase() + ': * ')
				isStar = true
			}
			continue
		}
		previousLineText = lineByteText
		isStar = false
		let lineText  = ''
		let asciiText = ''

		for (let i = 0; i < ADDR_STEP; i += 2) {
			const ch1 = /** @type {number} */ lineBytes[i]
			const ch2 = /** @type {number} */ lineBytes[i+1]

			lineText  += ch1.toString(16).padStart(2, '0').toUpperCase() +
						 ch2.toString(16).padStart(2, '0').toUpperCase() + ' '
			asciiText += (31 < ch1 && ch1 < 126 ? String.fromCharCode(ch1) : '.') +
						 (31 < ch2 && ch2 < 126 ? String.fromCharCode(ch2) : '.')
		}

		const ab = new ArrayBuffer(16)
		new Uint8Array(ab).set(lineBytes)
		const f64Bytes = new Float64Array(ab)
		const f64Text  = f64ToText(f64Bytes[0]) + ' ' + f64ToText(f64Bytes[1])
		lines.push(
			lineAddr.toString(10).padStart(5, '0') + ' ' +
			lineAddr.toString(16).padStart(4, '0').toUpperCase() + ': ' + lineText + asciiText + ' ' + f64Text)
	}

	memDump.innerText = lines.join('\n')
}

function f64ToText(num)
{
	if (num >= 0 && Number.isInteger(num)) {
		let nn = num < 70000 ? num : num % 100_000
		return nn.toString().padStart(5, ' ')
	}

	return '     '
}

/**
 * Dumps stacks and registers
 *
 * @param {HTMLElement} memDump
 * @param {(addr: number) => number} cFetch
 * @param {(addr: number) => number} fetch
 */
function debug(memDump, cFetch, fetch)
{
	const S = fetch(S_REG)
	let dsText = 'Data stack      : '
	for (let addr = DATA_STACK_ADDR; addr < S ; addr += WS)
		dsText += fetch(addr).toString(10) + ' '
	dsText += '<top'

	const R = fetch(R_REG)
	let retText = 'Return stack    : '
	for (let addr = RET_STACK_ADDR; addr < R ; addr += WS)
		retText += fetch(addr).toString(10) + ' '
	retText += '<top'

	const CF = fetch(CF_REG)
	let cfText = 'Control stack   : '
	for (let addr = CONTROL_FLOW_ADDR; addr < CF ; addr += WS)
		cfText += fetch(addr).toString(10) + ' '
	cfText += '<top'

	const ipText         = 'IP register     : ' + fetch(IP_REG).toString(10)
	const currentDefText = 'Current def addr: ' + fetch(CURRENT_DEF_ADDR).toString(10)
	const dataSpaceText  = 'Data space reg  : ' + fetch(DS_REG).toString(10)

	const toINAddr       = '>IN             : ' + fetch(TO_IN_ADDR).toString(10)
	const inputBuffChars = 'Input buff chars: ' + fetch(INPUT_BUFFER_CHARS_ADDR).toString(10)
	let   inputBuffer    = 'Input buffer    : '
	const charsCount     = fetch(INPUT_BUFFER_CHARS_ADDR)
	for (let i = 0; i < charsCount ; i += 1)
		inputBuffer += String.fromCharCode(cFetch(INPUT_BUFFER_ADDR + i))

	const parsedWordLen = cFetch(PARSE_WORD_ADDR)
	let   parsedWord    = 'Parsed word     : '
	for (let i = 0; i < parsedWordLen ; i += 1)
		parsedWord += String.fromCharCode(cFetch(PARSE_WORD_ADDR + 1 + i))

	memDump.innerText = dsText + '\n' + retText + '\n' + cfText + '\n' + ipText + '\n' +
		currentDefText + '\n' + dataSpaceText + '\n' + toINAddr + '\n' + inputBuffChars  + '\n' +
		inputBuffer + '\n' + parsedWord
}
