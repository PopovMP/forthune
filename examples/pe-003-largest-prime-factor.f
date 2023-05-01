\ Largest prime factor
\ https://projecteuler.net/problem=3
\ The prime factors of 13195 are 5, 7, 13 and 29.
\ What is the largest prime factor of the number 600851475143 ?

: lpf ( num -- res )
	2 ( num -- num res )

	begin
		over 1 >             \ num > 1
	while
		2dup mod 0= if       \ num % res == 0
			swap over / swap \ num = num / res
		else
			1+               \ res += 1
		then
	repeat
	
	swap drop ( num res -- res )
;

600851475143 lpf .
