class Executor
{
	public static run(tokens: Token[], env: Environment): ExecResult
	{
		for (let i = 0; i < tokens.length; i++) {
			const token: Token = tokens[i]

			if (token.error)
				return {status: Status.Fail, message: ` ${token.value} ${token.error}`}

			switch (token.kind) {
				case TokenKind.Number:
					env.dStack.push( Number(token.value) )
					break

				default:
					if (env.isLeave)
						break

					if (token.word === 'IF') {
						const res = Executor.runIF(tokens, i, env)
						if (res.status === Status.Fail)
							return {status: Status.Fail, message: res.message}
						if (typeof res.newIndex === 'number')
							i = res.newIndex
						break
					}

					if (token.word === 'DO' || token.word === '?DO') {
						const res = Executor.runDO(tokens, i, env)
						if (res.status === Status.Fail)
							return {status: Status.Fail, message: res.message}
						if (typeof res.newIndex === 'number')
							i = res.newIndex
						break
					}

					if (token.word === 'BEGIN') {
						const res = Executor.runBEGIN(tokens, i, env)
						if (res.status === Status.Fail)
							return {status: Status.Fail, message: res.message}
						if (typeof res.newIndex === 'number')
							i = res.newIndex
						break
					}

					if ( Dictionary.colonDef.hasOwnProperty(token.word) ) {
						const res = Executor.run(Dictionary.colonDef[token.word].tokens, env)
						if (res.status === Status.Fail)
							return {status: Status.Fail, message: res.message}
						break
					}

					if ( Dictionary.words.hasOwnProperty(token.word) ) {
						const res = Dictionary.words[token.word](env, token)
						if (res.status === Status.Fail)
							return {status: Status.Fail, message: res.message}
						if (env.isLeave)
							return {status: Status.Ok, message: ''}
						break
					}

					return {status: Status.Fail, message: `${token.value} ? (Execute)`}
			}
		}

		return {status: Status.Ok, message: ''}
	}

	public static runIF(tokens: Token[], index: number, env: Environment): ExecResult
	{
		// Find THEN index
		let thenIndex = index + 1
		let ifDepth = 1
		while (true) {
			thenIndex += 1
			if (thenIndex === tokens.length)
				return {status: Status.Fail, message: 'THEN Is missing'}
			const loopWord = tokens[thenIndex].value.toUpperCase()
			if (loopWord === 'IF')
				ifDepth += 1
			if (loopWord === 'THEN')
				ifDepth -= 1
			if (ifDepth === 0)
				break
		}

		// Find ELSE index
		let elseIndex = index + 1
		ifDepth = 1
		while (elseIndex < thenIndex) {
			elseIndex += 1
			const loopWord = tokens[elseIndex].value.toUpperCase()
			if (loopWord === 'IF')
				ifDepth += 1
			if (loopWord === 'THEN')
				ifDepth -= 1
			if (ifDepth === 1 && loopWord === 'ELSE')
				break
		}

		const flag = env.dStack.pop()

		if (flag) {
			// Consequent part
			const consTokens = tokens.slice(index+1, elseIndex)
			const res = Executor.run(consTokens, env)
			return {status: res.status, message: res.message, newIndex: thenIndex}
		}

		if (elseIndex < thenIndex) {
			// Alternative part
			const altTokens = tokens.slice(elseIndex+1, thenIndex)
			const res = Executor.run(altTokens, env)
			return {status: res.status, message: res.message, newIndex: thenIndex}
		}

		// Continuation
		return {status: Status.Ok, message: '', newIndex: thenIndex}
	}

	public static runDO(tokens: Token[], index: number, env: Environment): ExecResult
	{
		// Find LOOP index
		let loopIndex = index + 1
		let doDepth   = 1
		while (true) {
			loopIndex += 1
			if (loopIndex === tokens.length)
				return {status: Status.Fail, message: 'LOOP Not found'}
			const word = tokens[loopIndex].word
			if (word === 'DO')
				doDepth += 1
			if (word === 'LOOP' || word === '+LOOP')
				doDepth -= 1
			if (doDepth === 0)
				break
		}

		let   counter = env.dStack.pop()
		const limit   = env.dStack.pop()
		const upwards = limit > counter

		if (tokens[index].word === '?DO' && counter === limit) {
			// No entry in the loop
			env.isLeave = false
			return {status: Status.Ok, message: '', newIndex: loopIndex}
		}

		const isPlusLoop = tokens[loopIndex].word === '+LOOP'

		if (!isPlusLoop && !upwards)
			return {status: Status.Fail, message: 'LOOP Wrong range'}

		const doBody = tokens.slice(index+1, loopIndex)
		while (upwards ? counter < limit : counter >= limit) {
			env.rStack.push(counter)
			const res = Executor.run(doBody , env)
			env.rStack.pop()

			if (env.isLeave)
				break

			if (res.status === Status.Fail)
				return {status: Status.Fail, message: res.message}

			counter += isPlusLoop ? env.dStack.pop() : 1
		}

		// Continuation
		env.isLeave = false
		return {status: Status.Ok, message: '', newIndex: loopIndex}
	}

	public static runBEGIN(tokens: Token[], index: number, env: Environment): ExecResult
	{
		// Find WHILE, REPEAT, or UNTIL index
		let whileIndex = 0, repeatIndex = 0, untilIndex = 0
		let i = index + 1
		while (i < tokens.length) {
			const word = tokens[i].word
			if      (word === 'WHILE' ) whileIndex  = i
			else if (word === 'UNTIL' ) untilIndex  = i
			else if (word === 'REPEAT') repeatIndex = i
			i += 1
		}

		if (repeatIndex === 0 && whileIndex > 0)
			return {status: Status.Fail, message: 'WHILE Not found'}
		if (repeatIndex === 0 && untilIndex === 0)
			return {status: Status.Fail, message: 'BEGIN Not closed'}
		if (repeatIndex > 0 && untilIndex > 0)
			return {status: Status.Fail, message: 'BEGIN Control flow mismatched'}
		if (untilIndex > 0 && whileIndex > 0)
			return {status: Status.Fail, message: 'BEGIN Control flow mismatched'}

		// BEGIN <init-code> <flag> WHILE <body-code> REPEAT
		if (whileIndex > 0) {
			const initCode = tokens.slice(index + 1, whileIndex)
			const bodyCode = tokens.slice(whileIndex + 1, repeatIndex)

			while (true) {
				const initRes = Executor.run(initCode, env)
				if (initRes.status === Status.Fail)
					return {status: Status.Fail, message: initRes.message}

				const flag = env.dStack.pop()
				if (flag === 0) break

				const bodyRes = Executor.run(bodyCode, env)
				if (bodyRes.status === Status.Fail)
					return {status: Status.Fail, message: bodyRes.message}
			}

			// Continuation
			return {status: Status.Ok, message: '', newIndex: repeatIndex}
		}

		// BEGIN <body-code> <flag> UNTIL
		if (untilIndex > 0) {
			const bodyCode = tokens.slice(index+1, untilIndex)

			while(true) {
				const bodyRes = Executor.run(bodyCode, env)
				if (bodyRes.status === Status.Fail)
					return {status: Status.Fail, message: bodyRes.message}

				const flag = env.dStack.pop()
				if (flag !== 0) break
			}

			// Continuation
			return {status: Status.Ok, message: '', newIndex: untilIndex}
		}

		throw new Error('Unreachable')
	}
}
