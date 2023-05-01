\ Even Fibonacci numbers
\ https://projecteuler.net/problem=2
\ Find the sum of the even-valued terms lower than 4M.

: -rot ( x1 x2 x3 -- x3 x1 x2 ) swap rot swap ;
4000000 constant max_fibo

: even_fibos_sum ( -- res )
	0 0 1 ( -- res f1 f2 )
	begin
		swap over +         \ Update Fibos
		dup 2 mod 0= if     \ if (f2 % 2 == 0) 
			rot over + -rot \ res += f2
		then
	dup max_fibo > until    \ f2 < max_fibo
	2drop ( res f1 f2 -- res ) \ Drop Fibos
;

even_fibos_sum .
