class Executor
{
	public static run(tokens: Token[], env: Environment): ExecResult
	{
		let outText = ''

		for (let i = 0; i < tokens.length; i++) {
			const token: Token = tokens[i]

			if (token.error)
				return {status: Status.Fail, value: ` ${token.value} ${token.error}`}

			switch (token.kind) {
				case TokenKind.Number:
					env.dStack.push( Number(token.value) )
					break

				case TokenKind.Character:
					env.dStack.push( token.content.charCodeAt(0) )
					break

				case TokenKind.LineComment:
				case TokenKind.Comment:
				case TokenKind.DotComment:
					break

				case TokenKind.String:
					outText += token.content
					break

				case TokenKind.Value:
				case TokenKind.Constant:
					return {status: Status.Fail, value: `${token.value} No Execution`}

				case TokenKind.ValueTo:
					env.value[token.content.toUpperCase()] = env.dStack.pop()
					break

				case TokenKind.ColonDef:
					return {status: Status.Fail, value: `: No Execution`}

				case TokenKind.Word:
					if (env.isLeave)
						break

					if (token.word === 'IF') {
						const res = Executor.runIF(tokens, i, env)
						outText += res.value
						if (res.status === Status.Fail)
							return {status: Status.Fail, value: outText}
						if (typeof res.newIndex === 'number')
							i = res.newIndex
						break
					}

					if (token.word === 'DO' || token.word === '?DO') {
						const res = Executor.runDO(tokens, i, env)
						outText += res.value
						if (res.status === Status.Fail)
							return {status: Status.Fail, value: outText}
						if (typeof res.newIndex === 'number')
							i = res.newIndex
						break
					}

					if (token.word === 'BEGIN') {
						const res = Executor.runBEGIN(tokens, i, env)
						outText += res.value
						if (res.status === Status.Fail)
							return {status: Status.Fail, value: outText}
						if (typeof res.newIndex === 'number')
							i = res.newIndex
						break
					}

					if ( Dictionary.colonDef.hasOwnProperty(token.word) ) {
						const res = Executor.run(Dictionary.colonDef[token.word].tokens, env)
						outText += res.value
						if (res.status === Status.Fail)
							return {status: Status.Fail, value: outText}
						break
					}

					if ( env.value.hasOwnProperty(token.word) ) {
						env.dStack.push(env.value[token.word])
						continue
					}

					if ( env.constant.hasOwnProperty(token.word) ) {
						env.dStack.push(env.constant[token.word])
						continue
					}

					if ( Dictionary.words.hasOwnProperty(token.word) ) {
						const res = Dictionary.words[token.word](env)
						outText += res.value
						if (res.status === Status.Fail)
							return {status: Status.Fail, value: outText}
						if (env.isLeave)
							return {status: Status.Ok, value: outText}
						break
					}

					return {status: Status.Fail, value: `${outText} ${token.value} Unknown word`}

				default:
					return {status: Status.Fail, value: `${outText} ${token.value} Executor: Unknown TokenKind`}
			}
		}

		return {status: Status.Ok, value: outText}
	}

	public static runIF(tokens: Token[], index: number, env: Environment): ExecResult
	{
		// Find THEN index
		let thenIndex = index + 1
		let ifDepth = 1
		while (true) {
			thenIndex += 1
			if (thenIndex === tokens.length)
				return {status: Status.Fail, value: 'THEN Is missing'}
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
			return {status: res.status, value: res.value, newIndex: thenIndex}
		}

		if (elseIndex < thenIndex) {
			// Alternative part
			const altTokens = tokens.slice(elseIndex+1, thenIndex)
			const res = Executor.run(altTokens, env)
			return {status: res.status, value: res.value, newIndex: thenIndex}
		}

		// Continuation
		return {status: Status.Ok, value: '', newIndex: thenIndex}
	}

	public static runDO(tokens: Token[], index: number, env: Environment): ExecResult
	{
		// Find LOOP index
		let loopIndex = index + 1
		let doDepth   = 1
		while (true) {
			loopIndex += 1
			if (loopIndex === tokens.length)
				return {status: Status.Fail, value: 'LOOP Not found'}
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
			return {status: Status.Ok, value: '', newIndex: loopIndex}
		}

		const isPlusLoop = tokens[loopIndex].word === '+LOOP'

		if (!isPlusLoop && !upwards)
			return {status: Status.Fail, value: 'LOOP Wrong range'}

		let outText = ''
		while (upwards ? counter < limit : counter >= limit) {
			env.rStack.push(counter)
			const doBody = tokens.slice(index+1, loopIndex)
			const res = Executor.run(doBody , env)
			env.rStack.pop()

			if (env.isLeave)
				break

			outText += res.value
			if (res.status === Status.Fail)
				return {status: Status.Fail, value: outText}

			counter += isPlusLoop ? env.dStack.pop() : 1
		}

		// Continuation
		env.isLeave = false
		return {status: Status.Ok, value: outText, newIndex: loopIndex}
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
			return {status: Status.Fail, value: 'WHILE Not found'}
		if (repeatIndex === 0 && untilIndex === 0)
			return {status: Status.Fail, value: 'BEGIN Not closed'}
		if (repeatIndex > 0 && untilIndex > 0)
			return {status: Status.Fail, value: 'BEGIN Control flow mismatched'}
		if (untilIndex > 0 && whileIndex > 0)
			return {status: Status.Fail, value: 'BEGIN Control flow mismatched'}

		let outText = ''

		// BEGIN <init-code> <flag> WHILE <body-code> REPEAT
		if (whileIndex > 0) {
			const initCode = tokens.slice(index + 1, whileIndex)
			const bodyCode = tokens.slice(whileIndex + 1, repeatIndex)

			while (true) {
				const initRes  = Executor.run(initCode, env)
				outText += initRes.value
				if (initRes.status === Status.Fail)
					return {status: Status.Fail, value: outText}

				const flag = env.dStack.pop()
				if (flag === 0) break

				const bodyRes  = Executor.run(bodyCode, env)
				outText += bodyRes.value
				if (bodyRes.status === Status.Fail)
					return {status: Status.Fail, value: outText}
			}

			// Continuation
			return {status: Status.Ok, value: outText, newIndex: repeatIndex}
		}

		// BEGIN <body-code> <flag> UNTIL
		if (untilIndex > 0) {
			const bodyCode = tokens.slice(index+1, untilIndex)

			while(true) {
				const bodyRes = Executor.run(bodyCode, env)
				outText += bodyRes.value
				if (bodyRes.status === Status.Fail)
					return {status: Status.Fail, value: outText}

				const flag = env.dStack.pop()
				if (flag !== 0) break
			}

			// Continuation
			return {status: Status.Ok, value: outText, newIndex: untilIndex}
		}

		throw new Error('Unreachable')
	}
}
