'use strict'

const {strictEqual}  = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const {Tokenizer}   = require('../js/index')

const tokenizer = new Tokenizer()

function tok(code, expected)
{
	const actualCode = tokenizer.stringify( tokenizer.tokenizeLine(code, 0) )

	strictEqual(actualCode, expected)
}

describe('tokenize', () => {
	it('word', () => {
		tok('cr',
			'CR')
	})

	it('word with leading and trailing spaces', () => {
		tok(' cr ',
			'CR')
	})

	it('numbers', () => {
		tok('1 13 42',
			'1 13 42')
	})

	it('line comment', () => {
		tok('42 \\ foo',
			'42 \\ foo')
	})

	it('comment', () => {
		tok('( foo)',
			'( foo)')
	})

	it('comment unclosed', () => {
		tok('( foo',
			'( foo)')
	})

	it('comment with trailing space', () => {
		tok('( foo )',
			'( foo )')
	})

	it('string', () => {
		tok('." foo"',
			'." foo"')
	})

	it('string with trailing space', () => {
		tok('." foo "',
			'." foo "')
	})

	it('string unclosed', () => {
		tok('." foo',
			'." foo"')
	})

	it('def - only name', () => {
		tok(': sum',
			': SUM')
	})

	it('def with comment', () => {
		tok(': sum ( n n -- n ) + ;',
			': SUM ( n n -- n ) + ;')
	})

	it('def with unclosed comment', () => {
		tok(': foo .( compile foo',
			': FOO .( compile foo)')
	})

	it('def with interpolation words', () => {
		tok(': print10 ( -- "print nums" ) 11 1 do i . loop ; cr print10 cr',
			': PRINT10 ( -- "print nums" ) 11 1 DO I . LOOP ; CR PRINT10 CR')
	})
})
