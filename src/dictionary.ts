class Dictionary
{
	public static readonly colonDef: {[word: string]: ColonDef} = {}

	public static readonly words: {[word: string]: (env: Environment) => ExecResult} = {
		// Comments

		'(': () => {
			return {status: Status.Ok, value: ''}
		},

		'.(': (env: Environment) => {
			return env.runMode === RunMode.Interpret
				? {status: Status.Fail, value: '.( No Interpretation'}
				: {status: Status.Ok, value: ''}
		},

		'\\': () => {
			return {status: Status.Ok, value: ''}
		},

		// Char

		'BL': (env: Environment) => {
			// Put the ASCII code of space in Stack
			env.dStack.push(32)
			return {status: Status.Ok, value: ''}
		},

		'CHAR': () => {
			return {status: Status.Ok, value: ''}
		},

		// String

		'."': (env: Environment) => {
			return env.runMode === RunMode.Interpret
				? {status: Status.Fail, value: ' ."  No Interpretation'}
				: {status: Status.Ok, value: ''}
		},

		// Output

		'CR': () => {
			return {status: Status.Ok, value: '\n'}
		},

		'EMIT': (env: Environment) => {
			const charCode = env.dStack.pop()
			const char     = String.fromCharCode(charCode)
			return {status: Status.Ok, value: char}
		},

		'SPACE': () => {
			return {status: Status.Ok, value: ' '}
		},

		'SPACES': (env: Environment) => {
			const count = env.dStack.pop()
			return {status: Status.Ok, value: ' '.repeat(count)}
		},

		// Numbers

		'+': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 + n2)
			return {status: Status.Ok, value: ''}
		},

		'-': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 - n2)
			return {status: Status.Ok, value: ''}
		},

		'*': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 * n2)
			return {status: Status.Ok, value: ''}
		},

		'/': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 / n2)
			return {status: Status.Ok, value: ''}
		},

		'ABS': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(Math.abs(n1))
			return {status: Status.Ok, value: ''}
		},

		'MOD': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 % n2)
			return {status: Status.Ok, value: ''}
		},

		'MAX': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(Math.max(n1, n2))
			return {status: Status.Ok, value: ''}
		},

		'MIN': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(Math.min(n1, n2))
			return {status: Status.Ok, value: ''}
		},

		'NEGATE': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(-n1)
			return {status: Status.Ok, value: ''}
		},

		'INVERT': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(~n1)
			return {status: Status.Ok, value: ''}
		},

		'1+': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 + 1)
			return {status: Status.Ok, value: ''}
		},

		'1-': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 - 1)
			return {status: Status.Ok, value: ''}
		},

		'2*': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 << 1)
			return {status: Status.Ok, value: ''}
		},

		'2/': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 >> 1)
			return {status: Status.Ok, value: ''}
		},

		// Stack manipulation

		'.': (env: Environment) => {
			return {status: Status.Ok, value: env.dStack.pop().toString() + ' '}
		},

		'DEPTH': (env: Environment) => {
			env.dStack.push(env.dStack.depth())
			return {status: Status.Ok, value: ''}
		},

		'DUP': (env: Environment) => {
			env.dStack.push(env.dStack.pick(0))
			return {status: Status.Ok, value: ''}
		},

		'OVER': (env: Environment) => {
			env.dStack.push(env.dStack.pick(1))
			return {status: Status.Ok, value: ''}
		},

		'DROP': (env: Environment) => {
			env.dStack.pop()
			return {status: Status.Ok, value: ''}
		},

		'SWAP': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n2)
			env.dStack.push(n1)
			return {status: Status.Ok, value: ''}
		},

		'ROT': (env: Environment) => {
			const n3 = env.dStack.pop()
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n2)
			env.dStack.push(n3)
			env.dStack.push(n1)
			return {status: Status.Ok, value: ''}
		},

		'?DUP': (env: Environment) => {
			const n = env.dStack.pick(0)
			if (n !== 0)
				env.dStack.push(env.dStack.pick(0))
			return {status: Status.Ok, value: ''}
		},

		'NIP': (env: Environment) => {
			// ( x1 x2 -- x2 )
			const n2 = env.dStack.pop()
			env.dStack.pop() // n1
			env.dStack.push(n2)
			return {status: Status.Ok, value: ''}
		},

		'TUCK': (env: Environment) => {
			// ( x1 x2 -- x2 x1 x2 )
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n2)
			env.dStack.push(n1)
			env.dStack.push(n2)
			return {status: Status.Ok, value: ''}
		},

		'2DROP': (env: Environment) => {
			// ( x1 x2 -- )
			env.dStack.pop()
			env.dStack.pop()
			return {status: Status.Ok, value: ''}
		},

		'2DUP': (env: Environment) => {
			// ( x1 x2 -- x1 x2 x1 x2 )
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1)
			env.dStack.push(n2)
			env.dStack.push(n1)
			env.dStack.push(n2)
			return {status: Status.Ok, value: ''}
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
			return {status: Status.Ok, value: ''}
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
			return {status: Status.Ok, value: ''}
		},

		// Return stack

		'>R': (env: Environment) => {
			// ( x -- ) ( R: -- x )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, value: '>R  No Interpretation'}

			const n1 = env.dStack.pop()
			env.rStack.push(n1)
			return {status: Status.Ok, value: ''}
		},

		'R@': (env: Environment) => {
			// ( -- x ) ( R: x -- x )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, value: 'R@  No Interpretation'}

			const n1 = env.rStack.pick(0)
			env.dStack.push(n1)
			return {status: Status.Ok, value: ''}
		},

		'R>': (env: Environment) => {
			// ( -- x ) ( R: x -- )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, value: 'R>  No Interpretation'}

			const n1 = env.rStack.pop()
			env.dStack.push(n1)
			return {status: Status.Ok, value: ''}
		},

		'2>R': (env: Environment) => {
			// ( x1 x2 -- ) ( R: -- x1 x2 )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, value: '2>R  No Interpretation'}

			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.rStack.push(n1)
			env.rStack.push(n2)
			return {status: Status.Ok, value: ''}
		},

		'2R@': (env: Environment) => {
			// ( -- x1 x2 ) ( R: x1 x2 -- x1 x2 )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, value: '2R@  No Interpretation'}

			const n2 = env.rStack.pick(1)
			const n1 = env.rStack.pick(0)
			env.dStack.push(n1)
			env.dStack.push(n2)
			return {status: Status.Ok, value: ''}
		},

		'2R>': (env: Environment) => {
			// ( -- x1 x2 ) ( R: x1 x2 -- )
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, value: '2R>  No Interpretation'}

			const n2 = env.rStack.pop()
			const n1 = env.rStack.pop()
			env.dStack.push(n1)
			env.dStack.push(n2)
			return {status: Status.Ok, value: ''}
		},

		// Values

		'VALUE': () => {
			return {status: Status.Ok, value: ''}
		},

		'TO': () => {
			return {status: Status.Ok, value: ''}
		},

		// Constant

		'CONSTANT': () => {
			return {status: Status.Ok, value: ''}
		},

		// Comparison

		'=': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 === n2 ? -1 : 0)
			return {status: Status.Ok, value: ''}
		},

		'<>': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 !== n2 ? -1 : 0)
			return {status: Status.Ok, value: ''}
		},

		'>': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 > n2 ? -1 : 0)
			return {status: Status.Ok, value: ''}
		},

		'<': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 < n2 ? -1 : 0)
			return {status: Status.Ok, value: ''}
		},

		'0=': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 === 0 ? -1 : 0)
			return {status: Status.Ok, value: ''}
		},

		'0>': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 > 0 ? -1 : 0)
			return {status: Status.Ok, value: ''}
		},

		'0<': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 < 0 ? -1 : 0)
			return {status: Status.Ok, value: ''}
		},

		'0<>': (env: Environment) => {
			const n1 = env.dStack.pop()
			env.dStack.push(n1 !== 0 ? -1 : 0)
			return {status: Status.Ok, value: ''}
		},

		'AND': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 === n2 ? n1 : Math.abs(n1) === Math.abs(n2) ? Math.abs(n1) : 0)
			return {status: Status.Ok, value: ''}
		},

		'OR': (env: Environment) => {
			const n2 = env.dStack.pop()
			const n1 = env.dStack.pop()
			env.dStack.push(n1 || n2)
			return {status: Status.Ok, value: ''}
		},

		// BEGIN

		'BEGIN': (env: Environment) => {
			return env.runMode === RunMode.Interpret
				? {status: Status.Fail, value: 'BEGIN No Interpretation'}
				: {status: Status.Ok, value: ''}
		},

		'WHILE': () => {
			return {status: Status.Fail, value: 'WHILE Not expected'}
		},

		'UNTIL': () => {
			return {status: Status.Fail, value: 'UNTIL Not expected'}
		},

		'REPEAT': () => {
			return {status: Status.Fail, value: 'UNTIL Not expected'}
		},

		// DO

		'DO': (env: Environment) => {
			return env.runMode === RunMode.Interpret
				? {status: Status.Fail, value: 'DO No Interpretation'}
				: {status: Status.Ok, value: ''}
		},

		'?DO': (env: Environment) => {
			return env.runMode === RunMode.Interpret
				? {status: Status.Fail, value: '?DO No Interpretation'}
				: {status: Status.Ok, value: ''}
		},

		'I': (env: Environment) => {
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, value: 'I No Interpretation'}

			env.dStack.push( env.rStack.pick(0) )
			return {status: Status.Ok, value: ''}
		},

		'J': (env: Environment) => {
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, value: 'J No Interpretation'}

			env.dStack.push( env.rStack.pick(1) )
			return {status: Status.Ok, value: ''}
		},

		'LEAVE': (env: Environment) => {
			if (env.runMode === RunMode.Interpret)
				return {status: Status.Fail, value: 'LEAVE No Interpretation'}

			env.isLeave = true
			return {status: Status.Ok, value: ''}
		},

		'LOOP': () => {
			return {status: Status.Fail, value: 'LOOP Not expected'}
		},

		'+LOOP': () => {
			return {status: Status.Fail, value: '+LOOP Not expected'}
		},

		// IF

		'IF': (env: Environment) => {
			return env.runMode === RunMode.Interpret
				? {status: Status.Fail, value: 'IF No Interpretation'}
				: {status: Status.Ok, value: ''}
		},

		'ELSE': () => {
			return {status: Status.Fail, value: 'ELSE Not expected'}
		},

		'THEN': () => {
			return {status: Status.Fail, value: 'THEN Not expected'}
		},

		// Tools

		'.S': (env: Environment) => {
			return {status: Status.Ok, value: env.dStack.print()}
		},

		'WORDS': () => {
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

			return {status: Status.Ok, value: output.join('') + '\n'}
		},
	}
}
