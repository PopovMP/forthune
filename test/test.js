const process = require('node:process')
const {forth} = require('../js/forth.js')

/**
 * Prints a character
 * @param {number} char
 */
function write(char)
{
	if (char === 10) {
		process.stdout.write('\n', 'ascii')
		return
	}

	if (char < 32 && char > 126)
		throw new Error('Non-printable char code: ' + char)

	const text = String.fromCharCode(char)
	process.stdout.write(text, 'ascii')
}

const {interpret, pop} = forth(write)

let totalTests  = 0
let passedTests = 0

function assert(testName, expect, actual)
{
	totalTests += 1
	if (expect === actual) {
		passedTests += 1
		console.log(`\x1b[32m\x1b[1mOK - ${testName}\x1b[0m`)
	}
	else {
		console.log(`\x1b[31m\x1b[1mFAIL - ${testName}: Expected ${expect}, but got: ${actual}\x1b[0m`)
	}
}

function testReady()
{
	const color = totalTests === passedTests ? '\x1b[32m' : '\x1b[31m'
	console.log(`${color}\x1b[1m Tests: ${totalTests}, passed: ${passedTests}, failed: ${totalTests - passedTests} \x1b[0m`)
}

// Error cases

(function () {
	interpret('. Expected "Stack underflow"')
	assert('Stack underflow', 1, 1)
})();

(function () {
	interpret('foo Expected "foo ?"')
	assert('Unknown word', 1, 1)
})();

(function () {
	interpret(`' foo   Expected "foo ?"`)
	assert('Unknown word foo', 1, 1)
})();

// Strings

(function () {
	interpret('." Hello, World!"')
	assert('Interpretation ."', 1, 1)
})();

(function () {
	interpret('S" Hello, World!" OVER OVER TYPE SWAP DROP')
	assert('Interpretation S"', 13, pop())
})();

(function () {
	interpret('C" Hello, World!" DUP COUNT TYPE C@ ')
	assert('Interpretation C"', 13, pop())
})();

// Stack operations

(function () {
	interpret(' 42 43 DEPTH DUP .')
	assert('DEPTH', 2, pop())
	pop()
	pop()
})();

(function () {
	interpret(' 1 ?DUP + DUP .')
	assert('1 ?DUP', 2, pop())
})();

(function () {
	interpret(' 0 ?DUP DEPTH  DUP .')
	assert('0 ?DUP', 1, pop())
	pop()
})();

(function () {
	interpret('CREATE foo   foo   HERE')
	const expect = pop()
	const actual = pop()
	assert('CREATE and HERE', expect, actual)
})();

(function () {
	interpret('CREATE foo   42 ,  foo @  DUP .')
	assert('CREATE store fetch val', 42, pop())
})();

(function () {
	interpret(`VARIABLE bar 10 CELLS ALLOT    42 bar 4 CELLS + !    bar 4 CELLS + @   DUP .`)
	assert('VARIABLE store fetch val', 42, pop())
})();

(function () {
	interpret(`CREATE CR0   HERE  dup .  ' CR0 >BODY  dup . `)
	const expect = pop()
	const actual = pop()
	assert('CREATE \' >BODY', expect, actual)
})();

(function () {
	interpret(`42 CONSTANT ca   ca VALUE va  13 VALUE vb   va TO vb   vb DUP .`)
	assert('CONSTANT VALUE TO', 42, pop())
})();

(function () {
	interpret(`VARIABLE v5   42 v5 !   v5 @  DUP .`)
	assert('VARIABLE ! @', 42, pop())
})();

(function () {
	interpret(`42 CONSTANT c6   ' c6 EXECUTE   DUP .`)
	assert('CONSTANT EXECUTE', 42, pop())
})();

(function () {
	interpret(`CREATE hw    13 C,   CHAR H C, CHAR e C, CHAR l C, CHAR l C, CHAR o C, CHAR , C, BL C,`)
	interpret(`CHAR W C, CHAR o C, CHAR r C, CHAR l C, CHAR d C, CHAR ! C,  CR  hw COUNT TYPE`)
	assert('Hello World by chars', 1, 1)
})();

(function () {
	interpret(`21 ( foo ) dup .( interpreter ) + CR \\ Comments in`)
	assert('Comments in interpreter', 42, pop())
})();

// Colon def

(function () {
	// XT: nestRTS, NFA: unnestRTS
	interpret(`: colon-def-a ;  ' colon-def-a  DUP .  >BODY @ .`)
	assert('Empty colon-def', 1, 1)
})();

(function () {
	// PFA: literalRTS, PFA+8: 42
	interpret(`: colon-def-num 42 ; ' colon-def-num >BODY DUP @ .   8 + @ DUP .`)
	assert('Colon def with a num', 42, pop())
})();

(function () {
	interpret(`42   : colon-def-native DUP ;   colon-def-native   .`)
	assert('Colon-def native', 42, pop())
})();

(function () {
	interpret(` : fortyTwo 21 DUP + ;   ' fortyTwo   EXECUTE    DUP .`)
	assert('Def tick execute', 42, pop())
})();

(function () {
	interpret(`10 2   : colon-def-mt TUCK DUP + * + ;   colon-def-mt    DUP .  `)
	assert('Colon-def multiple native words', 42, pop())
})();

(function () {
	// R: push 42 on stack
	interpret(`: literal-rts 42 ;   literal-rts    DUP .`)
	assert('literal-rts', 42, pop())
})();

(function () {
	interpret(`: colon-def-range 42 43 44 ;   colon-def-range`)
	const range = [pop(), pop(), pop()].reverse().join(' ')
	assert('Range 42 43 44', '42 43 44', range)
})();

(function () {
	interpret(`: colon-def-lbr [ 42 DUP . ] ; `)
	assert('Left bracket', 42, pop())
})();

(function () {
	interpret(`: lit-def [ 42 ] LITERAL ;   lit-def DUP .`)
	assert('LITERAL', 42, pop())
})();

(function () {
	interpret('42  : dt DUP . ;   : sh dt ;  sh')
	assert('def call def', 42, pop())
})();

(function () {
	interpret(`: sum + ;   : multi * ;   : dot . ;`)
	interpret(`: one 1 ;   : two 2 ;     : three one two sum ;`)
	interpret(`: seven three DUP sum one sum ;   : twenty-one three seven multi ;`)
	interpret(`: forty-two twenty-one two multi ;   forty-two   DUP dot`)
	assert('forty-two', 42, pop())
})();

(function () {
	interpret(': immediate-def 42 DUP . ; IMMEDIATE   : foo immediate-def ;')
	assert('immediate-def', 42, pop())
})();

(function () {
	interpret(': MY+ POSTPONE + ; IMMEDIATE')
	interpret(': fpe MY+ ;')
	interpret('6 7 fpe DUP .')
	assert('POSTPONE 1', 13, pop())

	interpret(': fpe2  [ MY+ ] ;   6 7 fpe2  DUP .')
	assert('POSTPONE 2', 13, pop())
})();

(function () {
	interpret(': fp42 42 POSTPONE LITERAL ; IMMEDIATE')
	interpret(': fps42 fp42 ;')
	interpret('')
	assert('POSTPONE 3', 42, pop())
})();

(function () {
	interpret(': my-dup POSTPONE OVER POSTPONE OVER ; IMMEDIATE')
	interpret(': dup-dup my-dup ;')
	interpret('13 14 dup-dup + + + DUP .')
	assert('POSTPONE 4', 54, pop())
})();

(function () {
	interpret(`: def-s-string S" S String test" ;   def-s-string TYPE `)
	assert('Colon def S', 1, 1)
})();

(function () {
	interpret(`: def-counted-string C" Counted String test" ;   def-counted-string COUNT TYPE `)
	assert('Def with Counted string', 1, 1)
})();

(function () {
	interpret(`: def-dot-string ." Dot String test" ;   def-dot-string `)
	assert('Def with Dot string', 1, 1)
})();

(function () {
	// Dump String Field Area
	interpret(`56000 CONSTANT STRING_FIELD_ADDR`)
	interpret(`VARIABLE SFP`)
	interpret(`STRING_FIELD_ADDR SFP !`)
	interpret(`SFP @   DUP COUNT TYPE   DUP C@ + 1 +   SFP !`)
	interpret(`SFP @   DUP COUNT TYPE   DUP C@ + 1 +   SFP !`)
	interpret(`SFP @   DUP COUNT TYPE   DUP C@ + 1 +   SFP !`)
	interpret(`SFP @   DUP COUNT TYPE   DUP C@ + 1 +   SFP !`)
	interpret(`SFP @   DUP COUNT TYPE   DUP C@ + 1 +   SFP !`)
	interpret(`SFP @   DUP COUNT TYPE   DUP C@ + 1 +   SFP !`)
	interpret(`SFP @   DUP COUNT TYPE   DUP C@ + 1 +   SFP !`)
	interpret(`SFP @   DUP COUNT TYPE   DUP C@ + 1 +   SFP !`)
	assert('DUMP String Field', 1, 1)
})();

// AHEAD THEN

(function () {
	interpret(`: ah1 42 AHEAD DROP 13 THEN ;   ah1   .S`)
	assert('AHEAD', 42, pop())
})();

// IF ELSE THEN

(function () {
	interpret(`: if1 13 1 IF DROP 42 THEN ;   if1   .S`)
	assert('1 IF', 42, pop())
})();

(function () {
	interpret(`: if2 42 0 IF DROP 13 THEN ;   if2   .S`)
	assert('0 IF', 42, pop())
})();

(function () {
	interpret(`: if3 1 IF 42 ELSE 13 THEN ;   if3   .S`)
	assert('1 IF ELSE', 42, pop())
})();

(function () {
	interpret(`: if4 0 IF 13 ELSE 42 THEN ;   if4   .S`)
	assert('0 IF ELSE', 42, pop())
})();

(function () {
	interpret(`: if5 0 IF 13 ELSE if3 THEN ;   if5   .S`)
	assert('0 IF ELSE', 42, pop())
})();

// BEGIN UNTIL

(function () {
	interpret(`: until1 BEGIN 42 TRUE UNTIL ;   until1  .S`)
	assert('until1', 42, pop())
})();

(function () {
	interpret(`: sumRange 0 BEGIN   OVER +   SWAP 1 -   SWAP OVER   0= UNTIL   SWAP DROP ;   100 sumRange .S`)
	assert('sumRange', 5050, pop())
})();

// BEGIN UNTIL REPEAT

(function () {
	interpret(`: FACTORIAL                   `)
	interpret(`   DUP 2 < IF DROP 1 EXIT THEN`)
	interpret(`   DUP                        `)
	interpret(`   BEGIN DUP 2 > WHILE        `)
	interpret(`      1 - SWAP OVER * SWAP    `)
	interpret(`   REPEAT                     `)
	interpret(`   DROP                       `)
	interpret(`;                             `)
	interpret(`5 FACTORIAL   .S              `)
	assert('FACTORIAL', 120, pop())
})();

// BEGIN AGAIN

(function () {
	interpret(`: ag1 0 BEGIN   1 +   DUP 42 = IF EXIT THEN   AGAIN ;   ag1 .S`)
	assert('ag1', 42, pop())
})();

// DO LOOP

(function () {
	interpret(`: do1 1 DO   1 +   LOOP ;   1 42 do1 .S`)
	assert('do1', 42, pop())
})();

(function () {
	interpret(`: do2 1 6 1 DO   I *   LOOP ;   do2 .S`)
	assert('do2', 120, pop())
})();

(function () {
	interpret(`: do3 1   6 1 DO   1 0 DO J * LOOP   LOOP ;   do3 .S`)
	assert('do3', 120, pop())
})();

(function () {
	interpret(`: do4 0 5 10  DO   I +   -2 +LOOP ;   do4 .S`)
	assert('do4', 24, pop())
})();

(function () {
	interpret(`: do5 40 100 40 DO   1 +   DUP 42 = IF LEAVE THEN   LOOP ;   do5 .S`)
	assert('do5', 42, pop())
})();

testReady()
