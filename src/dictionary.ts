class Dictionary
{
	public static readonly colonDef: {[word: string]: ColonDef} = {}

	public static readonly words: {[word: string]: (env: Environment, token: Token) => ExecResult} = {
		// Definition

		':': (env: Environment) => {
			// ( C: "<spaces>name" -- colon-sys )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: ';  No Interpretation'}
			return {status: Status.Ok, message: ''}
		},

		';': (env: Environment) => {
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: ';  No Interpretation'}
			return {status: Status.Ok, message: ''}
		},

		// Comments

		'(': () => {
			// ( "ccc<paren>" -- )
			// Discard comment
			return {status: Status.Ok, message: ''}
		},

		'.(': (env: Environment, token: Token) => {
			// ( "ccc<paren>" -- )
			// Print comment on Interpretation and Compilation mode
			if (env.runMode === RunMode.Interpret ||
				env.runMode === RunMode.Compile)
				env.outputBuffer += token.content
			return {status: Status.Ok, message: ''}
		},

		'\\': () => {
			// ( "ccc<eol>" -- )
			// Discard comment
			return {status: Status.Ok, message: ''}
		},

		// Char

		'BL': (env: Environment) => {
			// Put the ASCII code of space in Stack
			env.dStack.push(32)
			return {status: Status.Ok, message: ''}
		},

		'CHAR': () => {
			return {status: Status.Ok, message: ''}
		},

		'C@': (env: Environment) => {
			// ( c-addr -- charCode )
			// Fetch the character code stored at c-addr.
			const cAddr = env.dStack.pop()
			if (cAddr < 0 || cAddr >= env.cs)
				return {status: Status.Fail, message: 'C@ Address out of range'}
			const charCode = env.cString[cAddr]
			env.dStack.push(charCode)
			return {status: Status.Ok, message: ''}
		},

		// String

		'."': (env: Environment, token: Token) => {
			env.outputBuffer += token.content

			return {status: Status.Ok, message: ''}
		},

		'C"': (env: Environment, token: Token) => {

			Dictionary.words['S"'](env, token)
			env.dStack.pop()               // Drops the string length
			const cAddr = env.dStack.pop() // Address of the first character
			env.dStack.push(cAddr-1)       // Address of the leading count byte

			return {status: Status.Ok, message: ''}
		},

		'S"': (env: Environment, token: Token) => {
			const text = token.content

			env.cString[env.cs] = text.length
			env.cs += 1

			env.dStack.push(env.cs)
			env.dStack.push(text.length)

			for (let i = 0; i < text.length; i += 1) {
				env.cString[env.cs] = text.charCodeAt(i)
				env.cs += 1
			}

			return {status: Status.Ok, message: ''}
		},

		'COUNT': (env: Environment) => {
			// ( c-addr1 -- c-addr2 u )
			// c-addr1 - address of a leading count byte
			// c-addr2 - address of the first char
			// u - string length
			const cAddr1 = env.dStack.pop()
			const len = env.cString[cAddr1]
			env.dStack.push(cAddr1 + 1)
			env.dStack.push(len)
			return {status: Status.Ok, message: ''}
		},

		'TYPE': (env: Environment) => {
			const len   = env.dStack.pop()
			const cAddr = env.dStack.pop()
			const chars = Array(len)
			for (let i = 0; i < len; i += 1)
				chars[i] = String.fromCharCode(env.cString[cAddr + i])
			env.outputBuffer += chars.join('')
			return {status: Status.Ok, message: ''}
		},

		// Output

		'CR': (env: Environment) => {
			env.outputBuffer += '\n'
			return {status: Status.Ok, message: ''}
		},

		'EMIT': (env: Environment) => {
			const charCode  = env.dStack.pop()
			const character = String.fromCharCode(charCode)
			env.outputBuffer += character
			return {status: Status.Ok, message: ''}
		},

		'SPACE': (env: Environment) => {
			env.outputBuffer += ' '
			return {status: Status.Ok, message: ''}
		},

		'SPACES': (env: Environment) => {
			const count = env.dStack.pop()
			env.outputBuffer += ' '.repeat(count)
			return {status: Status.Ok, message: ''}
		},

		// Numbers

		'+': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 + n2)
			return {status: Status.Ok, message: ''}
		},

		'-': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 - n2)
			return {status: Status.Ok, message: ''}
		},

		'*': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 * n2)
			return {status: Status.Ok, message: ''}
		},

		'/': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 / n2)
			return {status: Status.Ok, message: ''}
		},

		'ABS': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(Math.abs(n1))
			return {status: Status.Ok, message: ''}
		},

		'MOD': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 % n2)
			return {status: Status.Ok, message: ''}
		},

		'MAX': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(Math.max(n1, n2))
			return {status: Status.Ok, message: ''}
		},

		'MIN': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(Math.min(n1, n2))
			return {status: Status.Ok, message: ''}
		},

		'NEGATE': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(-n1)
			return {status: Status.Ok, message: ''}
		},

		'INVERT': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(~n1)
			return {status: Status.Ok, message: ''}
		},

		'1+': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 + 1)
			return {status: Status.Ok, message: ''}
		},

		'1-': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 - 1)
			return {status: Status.Ok, message: ''}
		},

		'2*': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 << 1)
			return {status: Status.Ok, message: ''}
		},

		'2/': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 >> 1)
			return {status: Status.Ok, message: ''}
		},

		// Stack manipulation

		'.': (env: Environment) => {
			const n = env.dStack.pop()
			env.outputBuffer += String(n) + ' '
			return {status: Status.Ok, message: ''}
		},

		'DEPTH': (env: Environment) => {
			env.dStack.push(env.dStack.depth())
			return {status: Status.Ok, message: ''}
		},

		'DUP': (env: Environment) => {
			env.dStack.push(env.dStack.pick(0))
			return {status: Status.Ok, message: ''}
		},

		'OVER': (env: Environment) => {
			env.dStack.push(env.dStack.pick(1))
			return {status: Status.Ok, message: ''}
		},

		'DROP': (env: Environment) => {
			env.dStack.pop()
			return {status: Status.Ok, message: ''}
		},

		'SWAP': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n2)
			env.dStack.push(n1)
			return {status: Status.Ok, message: ''}
		},

		'ROT': (env: Environment) => {
			const n3 = env.dStack.pop()
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n2)
			env.dStack.push(n3)
			env.dStack.push(n1)
			return {status: Status.Ok, message: ''}
		},

		'?DUP': (env: Environment) => {
			const n = env.dStack.pick(0)
			if (n !== 0)
				env.dStack.push(env.dStack.pick(0))
			return {status: Status.Ok, message: ''}
		},

		'NIP': (env: Environment) => {
			// ( x1 x2 -- x2 )
			const n2 = env.dStack.pop()
			env.dStack.pop() // n1
			env.dStack.push(n2)
			return {status: Status.Ok, message: ''}
		},

		'TUCK': (env: Environment) => {
			// ( x1 x2 -- x2 x1 x2 )
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n2)
			env.dStack.push(n1)
			env.dStack.push(n2)
			return {status: Status.Ok, message: ''}
		},

		'2DROP': (env: Environment) => {
			// ( x1 x2 -- )
			env.dStack.pop()
			env.dStack.pop()
			return {status: Status.Ok, message: ''}
		},

		'2DUP': (env: Environment) => {
			// ( x1 x2 -- x1 x2 x1 x2 )
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1)
			env.dStack.push(n2)
			env.dStack.push(n1)
			env.dStack.push(n2)
			return {status: Status.Ok, message: ''}
		},

		'2SWAP': (env: Environment) => {
			// ( x1 x2 x3 x4 -- x3 x4 x1 x2 )
			const n4 = env.dStack.pop()
			const n3 = env.dStack.pop()
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n3)
			env.dStack.push(n4)
			env.dStack.push(n1)
			env.dStack.push(n2)
			return {status: Status.Ok, message: ''}
		},

		'2OVER': (env: Environment) => {
			// ( x1 x2 x3 x4 -- x1 x2 x3 x4 x1 x2 )
			const n4 = env.dStack.pop()
			const n3 = env.dStack.pop()
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1)
			env.dStack.push(n2)
			env.dStack.push(n3)
			env.dStack.push(n4)
			env.dStack.push(n1)
			env.dStack.push(n2)
			return {status: Status.Ok, message: ''}
		},

		// Return stack

		'>R': (env: Environment) => {
			// ( x -- ) ( R: -- x )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: '>R  No Interpretation'}

			const n1 = env.dStack.pop()
			env.rStack.push(n1)
			return {status: Status.Ok, message: ''}
		},

		'R@': (env: Environment) => {
			// ( -- x ) ( R: x -- x )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: 'R@  No Interpretation'}

			const n1 = env.rStack.pick(0)
			env.dStack.push(n1)
			return {status: Status.Ok, message: ''}
		},

		'R>': (env: Environment) => {
			// ( -- x ) ( R: x -- )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: 'R>  No Interpretation'}

			const n1 = env.rStack.pop()
			env.dStack.push(n1)
			return {status: Status.Ok, message: ''}
		},

		'2>R': (env: Environment) => {
			// ( x1 x2 -- ) ( R: -- x1 x2 )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: '2>R  No Interpretation'}

			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.rStack.push(n1)
			env.rStack.push(n2)
			return {status: Status.Ok, message: ''}
		},

		'2R@': (env: Environment) => {
			// ( -- x1 x2 ) ( R: x1 x2 -- x1 x2 )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: '2R@  No Interpretation'}

			const n2 = env.rStack.pick(1)
			const n1 = env.rStack.pick(0)
			env.dStack.push(n1)
			env.dStack.push(n2)
			return {status: Status.Ok, message: ''}
		},

		'2R>': (env: Environment) => {
			// ( -- x1 x2 ) ( R: x1 x2 -- )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: '2R>  No Interpretation'}

			const n2 = env.rStack.pop()
			const n1 = env.rStack.pop()
			env.dStack.push(n1)
			env.dStack.push(n2)
			return {status: Status.Ok, message: ''}
		},

		// Memory

		'ALIGNED': (env: Environment) => {
			// ( addr -- a-addr )
			const addr = env.dStack.pop()
			const remainder = addr % 8
			const aligned   = remainder === 0 ? addr :  addr + 8 - remainder
			env.dStack.push(aligned)
			return {status: Status.Ok, message: ''}
		},

		'CHARS': (env: Environment) => {
			// ( n1 -- n2 )
			const n1 = env.dStack.pop()
			env.dStack.push(n1)
			return {status: Status.Ok, message: ''}
		},

		'CHAR+': (env: Environment) => {
			// ( c-addr1 -- c-addr2 )
			const addr1 = env.dStack.pop()
			env.dStack.push(addr1+1)
			return {status: Status.Ok, message: ''}
		},

		'CELLS': (env: Environment) => {
			// ( n1 -- n2 )
			const n1 = env.dStack.pop()
			env.dStack.push(n1<<3)
			return {status: Status.Ok, message: ''}
		},

		'CELL+': (env: Environment) => {
			// ( a-addr1 -- a-addr2 )
			const addr1 = env.dStack.pop()
			env.dStack.push(addr1+8)
			return {status: Status.Ok, message: ''}
		},

		// Values

		'VALUE': () => {
			return {status: Status.Ok, message: ''}
		},

		'TO': () => {
			return {status: Status.Ok, message: ''}
		},

		// Constant

		'CONSTANT': () => {
			return {status: Status.Ok, message: ''}
		},

		// Comparison

		'=': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 === n2 ? -1 : 0)
			return {status: Status.Ok, message: ''}
		},

		'<>': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 !== n2 ? -1 : 0)
			return {status: Status.Ok, message: ''}
		},

		'>': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 > n2 ? -1 : 0)
			return {status: Status.Ok, message: ''}
		},

		'<': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 < n2 ? -1 : 0)
			return {status: Status.Ok, message: ''}
		},

		'0=': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 === 0 ? -1 : 0)
			return {status: Status.Ok, message: ''}
		},

		'0>': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 > 0 ? -1 : 0)
			return {status: Status.Ok, message: ''}
		},

		'0<': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 < 0 ? -1 : 0)
			return {status: Status.Ok, message: ''}
		},

		'0<>': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 !== 0 ? -1 : 0)
			return {status: Status.Ok, message: ''}
		},

		'AND': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 === n2 ? n1 : Math.abs(n1) === Math.abs(n2) ? Math.abs(n1) : 0)
			return {status: Status.Ok, message: ''}
		},

		'OR': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 || n2)
			return {status: Status.Ok, message: ''}
		},

		// BEGIN

		'BEGIN': (env: Environment) => {
			return env.runMode === RunMode.Interpret
				? {status: Status.Fail, message: 'BEGIN No Interpretation'}
				: {status: Status.Ok, message: ''}
		},

		'WHILE': () => {
			return {status: Status.Fail, message: 'WHILE Not expected'}
		},

		'UNTIL': () => {
			return {status: Status.Fail, message: 'UNTIL Not expected'}
		},

		'REPEAT': () => {
			return {status: Status.Fail, message: 'UNTIL Not expected'}
		},

		// DO

		'DO': (env: Environment) => {
			return env.runMode === RunMode.Interpret
				? {status: Status.Fail, message: 'DO No Interpretation'}
				: {status: Status.Ok, message: ''}
		},

		'?DO': (env: Environment) => {
			return env.runMode === RunMode.Interpret
				? {status: Status.Fail, message: '?DO No Interpretation'}
				: {status: Status.Ok, message: ''}
		},

		'I': (env: Environment) => {
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: 'I No Interpretation'}

			env.dStack.push( env.rStack.pick(0) )
			return {status: Status.Ok, message: ''}
		},

		'J': (env: Environment) => {
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: 'J No Interpretation'}

			env.dStack.push( env.rStack.pick(1) )
			return {status: Status.Ok, message: ''}
		},

		'LEAVE': (env: Environment) => {
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: 'LEAVE No Interpretation'}

			env.isLeave = true
			return {status: Status.Ok, message: ''}
		},

		'LOOP': () => {
			return {status: Status.Fail, message: 'LOOP Not expected'}
		},

		'+LOOP': () => {
			return {status: Status.Fail, message: '+LOOP Not expected'}
		},

		// IF

		'IF': (env: Environment) => {
			return env.runMode === RunMode.Interpret
				? {status: Status.Fail, message: 'IF No Interpretation'}
				: {status: Status.Ok, message: ''}
		},

		'ELSE': () => {
			return {status: Status.Fail, message: 'ELSE Not expected'}
		},

		'THEN': () => {
			return {status: Status.Fail, message: 'THEN Not expected'}
		},

		// Tools

		'.S': (env: Environment) => {
			env.outputBuffer += env.dStack.print()
			return {status: Status.Ok, message: ''}
		},

		'WORDS': (env: Environment) => {
			const words = [
				...Object.keys(Dictionary.colonDef),
				...Object.keys(Dictionary.words),
			].sort()

			const output = []

			for (let i = 0; i < words.length; i++) {
				if (i % 6 === 0)
					output.push('\n')
				output.push(words[i].padEnd(10, ' '))
			}

			env.outputBuffer += output.join('') + '\n'
			return {status: Status.Ok, message: ''}
		},

		'PAGE': (env: Environment) => {
			env.outputBuffer = ''
			return {status: Status.Ok, message: ''}
		},
	}
}
