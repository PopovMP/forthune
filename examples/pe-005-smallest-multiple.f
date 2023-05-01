: increment ( -- res )
	20
	begin
		dup 19 mod 0= if
		dup 18 mod 0= if
		dup 17 mod 0= if
		dup 16 mod 0= if
			exit
		then then then then
		20 +
	again
;

: euler5 ( inc first -- res )
	begin
		dup 15 mod 0= if
		dup 14 mod 0= if
		dup 13 mod 0= if
		dup 12 mod 0= if
		dup 11 mod 0= if
			nip exit
		then then then then then
		over +
	again
;

increment dup euler5 .
