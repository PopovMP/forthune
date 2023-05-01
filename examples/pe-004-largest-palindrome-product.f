\ Largest palindrome product
\ https://projecteuler.net/problem=4
\ Find the largest palindrome made from the product of two 3-digit numbers.

: pal1 ( n -- m ) 10 mod 100000 * ;
: pal2 ( n -- m ) dup  100 mod swap  10 mod - 1000 * ;
: pal3 ( n -- m ) dup 1000 mod swap 100 mod -   10 * ;
: pal4 ( n -- m ) 1000 mod ;
: pal? ( n -- f ) dup pal1 over pal2 + over pal3 + over pal4 + = ;

: euler4 ( -- pal )
	100001     \ initial palindrome
	999 100 do
	999 100 do
		i j *  \ new candidate
		dup pal? if max else drop then
	loop loop
;

euler4 .
