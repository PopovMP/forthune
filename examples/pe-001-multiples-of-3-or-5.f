\ Project Euler 1
\  https://projecteuler.net/problem=1
\ Multiples of 3 or 5
\ If we list all the natural numbers below 10 that are multiples of 3 or 5,
\   we get 3, 5, 6 and 9. The sum of these multiples is 23.
\ Find the sum of all the multiples of 3 or 5 below 1000.

: multiples ( max -- res )
	0 swap ( max -- res max )
	0 do   ( res max -- res )
		i 3 mod 0= if i + else ( res -- res )
		i 5 mod 0= if i + else ( res -- res )
		then then
	loop
;

1000 multiples .
