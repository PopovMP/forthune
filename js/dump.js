'use strict'

/**
 *
 * @param {HTMLElement} memDump
 *
 * @param {(addr: number) => number} cFetch
 * @param {number} MEM_SIZE
 */
function dump(memDump, cFetch, MEM_SIZE)
{
	const ADDR_STEP = 16
	const lines = [		' Dec  Hex     0 1  2 3  4 5  6 7  8 9  A B  C D  E F ']
	let previousLineText = ''
	let isStar = false
	for (let lineAddr = 0; lineAddr < MEM_SIZE; lineAddr += ADDR_STEP) {
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
					lineAddr.toString(16).padStart(4, '0').toUpperCase() + ' : * ')
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

			lineText += ch1.toString(16).padStart(2, '0').toUpperCase() +
						ch2.toString(16).padStart(2, '0').toUpperCase() + ' '
			asciiText += (31 < ch1 && ch1 !== 126 && ch1 < 256 ? String.fromCharCode(ch1) : '.') +
						 (31 < ch2 && ch2 !== 126 && ch2 < 256 ? String.fromCharCode(ch2) : '.')
		}
		lines.push(
			lineAddr.toString(10).padStart(5, '0') + ' ' +
			lineAddr.toString(16).padStart(4, '0').toUpperCase() + ' : ' + lineText + '  ' + asciiText)
	}

	memDump.innerText = lines.join('\n')
}
