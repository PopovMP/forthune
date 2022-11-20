'use strict'

const {strictEqual}  = require('assert')
const {describe, it} = require('@popovmp/mocha-tiny')
const {Parser}   = require('../js/index')

function tok(code, expected)
{
	strictEqual(Parser.stringify( Parser.parseLine(code, 0) ), expected)
}

describe('tokenize', () => {
	it('word', () => {
		tok('cr ',
			'cr')
	})

	it('word with leading and trailing spaces', () => {
		tok(' cr ',
			'cr')
	})

	it('numbers', () => {
		tok('1 13 42 ',
			'1 13 42')
	})

	it('line comment', () => {
		tok('42 \\ foo ',
			'42 \\ foo ')
	})

	it('comment', () => {
		tok('( foo)',
			'( foo)')
	})

	it('comment with trailing space', () => {
		tok('( foo ) ',
			'( foo )')
	})

	it('char', () => {
		tok('char foo" ',
			'char foo"')
	})

	it('string', () => {
		tok('." foo" ',
			'." foo"')
	})

	it('string one', () => {
		tok('." *" ',
			'." *"')
	})

	it('string with trailing space', () => {
		tok('." foo " ',
			'." foo "')
	})

	it('multi string', () => {
		tok(': foo CR ."    *" CR ."   **" CR ."  ***" CR ." ****" ; ',
			': foo CR ."    *" CR ."   **" CR ."  ***" CR ." ****" ;')
	})

	it('def - only name ', () => {
		tok(': sum',
			': sum')
	})

	it('def with comment', () => {
		tok(': sum ( n n -- n ) + ; ',
			': sum ( n n -- n ) + ;')
	})

	it('def with dot-comment', () => {
		tok(': foo .( compile foo) ',
			': foo .( compile foo)')
	})

	it('def with interpolation words', () => {
		tok(': print10 ( -- "print nums" ) 11 1 do i . loop ; cr print10 cr ',
			': print10 ( -- "print nums" ) 11 1 do i . loop ; cr print10 cr')
	})

	it('variable', () => {
		tok('42 variable foo ',
			'42 variable foo')
	})

	it('variable with spaces', () => {
		tok('  42   variable     foo   ',
			'42 variable foo')
	})
})
