class Dictionary
{
	public static readonly colonDef: {[word: string]: ColonDef} = {}

	public static readonly words: {[word: string]: (env: Environment, token: Token) => ExecResult} = {

		'BASE': (env: Environment) => {
			// ( -- a-addr )
			// a-addr is the address of a cell containing the current number-conversion radix {{2...36}}.
			env.dStack.push( env.memory.base() )
			return {status: Status.Ok, message: ''}
		},

		'HEX': (env: Environment) => {
			// ( -- )
			// Set contents of BASE to sixteen.
			env.memory.storeCell(env.memory.base(), 16)
			return {status: Status.Ok, message: ''}
		},

		'DECIMAL': (env: Environment) => {
			// ( -- )
			// Set the numeric conversion radix to ten (decimal).
			env.memory.storeCell(env.memory.base(), 10)
			return {status: Status.Ok, message: ''}
		},

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

		'CHAR': (env: Environment, token: Token) => {
			// ( "<spaces>name" -- char )
			env.dStack.push( token.content.charCodeAt(0) )
			return {status: Status.Ok, message: ''}
		},

		'[CHAR]': (env: Environment, token: Token) => {
			// (C: "<spaces>name" -- ) ( -- char )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, message: '[CHAR] No Interpretation'}

			env.dStack.push( token.content.charCodeAt(0) )
			return {status: Status.Ok, message: ''}
		},

		'C@': (env: Environment) => {
			// ( c-addr -- char )
			const cAddr = env.dStack.pop()
			const char  = env.memory.fetchChar(cAddr)
			env.dStack.push(char)
			return {status: Status.Ok, message: ''}
		},

		'C!': (env: Environment) => {
			// ( char c-addr -- )
			const cAddr = env.dStack.pop()
			const char  = env.dStack.pop()
			env.memory.storeChar(cAddr, char)
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
			const len  = text.length
			env.memory.create('')
			const lenAddr = env.memory.here()
			env.memory.allot(len+1)
			env.memory.storeChar(lenAddr, len)

			const addr = lenAddr+1
			env.dStack.push(addr)
			env.dStack.push(text.length)

			for (let i = 0; i < len; i += 1)
				env.memory.storeChar(addr + i, text.charCodeAt(i))

			return {status: Status.Ok, message: ''}
		},

		'COUNT': (env: Environment) => {
			// ( c-addr1 -- c-addr2 u )
			// c-addr1 - address of a leading count byte
			// c-addr2 - address of the first char
			// u - string length
			const cAddr1 = env.dStack.pop()
			const len = env.memory.fetchChar(cAddr1)
			env.dStack.push(cAddr1+1)
			env.dStack.push(len)
			return {status: Status.Ok, message: ''}
		},

		'TYPE': (env: Environment) => {
			// ( c-addr u -- )
			const len   = env.dStack.pop()
			const cAddr = env.dStack.pop()
			const chars = Array(len)
			for (let i = 0; i < len; i += 1)
				chars[i] = String.fromCharCode( env.memory.fetchChar(cAddr + i) )
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
			const n     = env.dStack.pop()
			const radix = env.memory.fetchCell( env.memory.base() )
			const text  = Number.isInteger(n) ? n.toString(radix).toUpperCase() : String(n)
			env.outputBuffer += text + ' '
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

		'ALIGN': (env: Environment) => {
			// ( -- )
			env.memory.align()
			return {status: Status.Ok, message: ''}
		},

		'HERE': (env: Environment) => {
			const addr = env.memory.here()
			env.dStack.push(addr)
			return {status: Status.Ok, message: ''}
		},

		'CREATE': (env: Environment, token: Token) => {
			// ( "<spaces>name" -- )
			env.memory.create(token.content.toUpperCase())
			return {status: Status.Ok, message: ''}
		},

		'ALLOT': (env: Environment) => {
			// ( n -- )
			const n = env.dStack.pop()
			env.memory.allot(n)
			return {status: Status.Ok, message: ''}
		},

		'VARIABLE': (env: Environment, token: Token) => {
			// ( "<spaces>name" -- )
			Dictionary.words['CREATE'](env, token)
			const addr = env.memory.here()
			env.memory.allot(8)
			env.memory.storeCell(addr, 0)
			return {status: Status.Ok, message: ''}
		},

		'!': (env: Environment) => {
			// ( x a-addr -- )
			const addr = env.dStack.pop()
			const n    = env.dStack.pop()
			env.memory.storeCell(addr, n)
			return {status: Status.Ok, message: ''}
		},

		'@': (env: Environment) => {
			// ( a-addr -- x )
			const addr = env.dStack.pop()
			const n    = env.memory.fetchCell(addr)
			env.dStack.push(n)
			return {status: Status.Ok, message: ''}
		},

		',': (env: Environment) => {
			// ( x -- )
			const addr = env.memory.here()
			env.memory.allot(8)
			const n = env.dStack.pop()
			env.memory.storeCell(addr, n)
			return {status: Status.Ok, message: ''}
		},

		'C,': (env: Environment) => {
			// ( char  -- )
			const addr = env.memory.here()
			env.memory.allot(1)
			const n = env.dStack.pop()
			env.memory.storeChar(addr, n)
			return {status: Status.Ok, message: ''}
		},

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

		'\'': (env: Environment, token: Token) => {
			// ( "<spaces>name" -- xt )
			const addr = env.memory.findName( token.content.toUpperCase() )
			if (addr === 0)
				return {status: Status.Fail, message: `${token.value} ?`}
			const addrSemantics = addr + 40
			env.dStack.push(addrSemantics)
			return {status: Status.Ok, message: ''}
		},

		'EXECUTE': (env: Environment) => {
			// ( i * x xt -- j * x )
			// Remove xt from the stack and perform the semantics identified by it.
			const addrSemantics = env.dStack.pop()
			const semantics = env.memory.fetchCell(addrSemantics)

			switch (semantics) {
				case RunTimeSemantics.BuiltInWord:
				case RunTimeSemantics.ColonDef:
					const nameLength = env.memory.fetchChar(addrSemantics - 40)
					const chars      = Array(nameLength)
					const cAddr      = addrSemantics - 40 + 1
					for (let i = 0; i < nameLength; i += 1)
						chars[i] = String.fromCharCode(env.memory.fetchChar(cAddr + i))
					const word = chars.join('')
					if (semantics === RunTimeSemantics.BuiltInWord && Dictionary.words.hasOwnProperty(word))
						return Dictionary.words[word](env,
							{kind: TokenKind.Word, error: '', content: '', value: word, word, number: 0})
					if (semantics === RunTimeSemantics.ColonDef && Dictionary.colonDef.hasOwnProperty(word))
						return Executor.run(Dictionary.colonDef[word].tokens, env)
					return {status: Status.Fail, message: `${word} ?`}

				case RunTimeSemantics.DataAddress:
				case RunTimeSemantics.Variable:
					env.dStack.push(addrSemantics + 8)
					break

				case RunTimeSemantics.Value:
				case RunTimeSemantics.Constant:
					const value = env.memory.fetchCell(addrSemantics + 8)
					env.dStack.push(value)
					break

				default:
					throw new Error('EXECUTE Unreachable')
			}

			return {status: Status.Ok, message: ''}
		},

		// Values

		'VALUE': (env: Environment, token: Token) => {
			// ( x "<spaces>name" -- )
			const n = env.dStack.pop()
			Dictionary.words['VARIABLE'](env, token)
			const addr = env.memory.here() - 8
			env.memory.storeCell(addr, n)
			env.memory.storeCell(addr-8, RunTimeSemantics.Value)
			return {status: Status.Ok, message: ''}
		},

		'TO': (env: Environment, token: Token) => {
			// ( x "<spaces>name" -- )
			const word = token.content.toUpperCase()
			const addr = env.memory.findName(word)
			const rtb  = env.memory.fetchCell(addr+40) as RunTimeSemantics
			if (rtb !== RunTimeSemantics.Value)
				return {status: Status.Fail, message: `${token.content} Not a VALUE`}
			const n = env.dStack.pop()
			env.memory.storeCell(addr+48, n)
			return {status: Status.Ok, message: ''}
		},

		// Constant

		'CONSTANT': (env: Environment, token: Token) => {
			// ( x "<spaces>name" -- )
			const n = env.dStack.pop()
			Dictionary.words['VARIABLE'](env, token)
			const addr = env.memory.here() - 8
			env.memory.storeCell(addr, n)
			env.memory.storeCell(addr-8, RunTimeSemantics.Constant)
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
			const radix = env.memory.fetchCell( env.memory.base() )
			env.outputBuffer += env.dStack.print()
				.map( (n: number) => Number.isInteger(n) ? n.toString(radix).toUpperCase() : String(n))
				.join(' ') + ' <- Top'
			return {status: Status.Ok, message: ''}
		},

		'WORDS': (env: Environment) => {
			const words = [
				...Object.keys(Dictionary.colonDef),
				...Object.keys(Dictionary.words),
			].sort()

			const output = []

			for (let i = 0; i < words.length; i++) {
				if (i % 8 === 0)
					output.push('\n')
				output.push(words[i].slice(0, 9).padEnd(10, ' '))
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
