"""Fizz Buzz Game
Order: 5

The classic programming interview question! It prints numbers from 1 to 100, substituting multiples of 3 with 'Fizz' and multiples of 5 with 'Buzz'.
"""
for number in range(1,101):
    if number % 15 == 0:
        print ("Fizz Buzz")
    elif number % 5 == 0:
        print ("Buzz")
    elif number % 3 ==0:
        print ("Fizz")
    else:
        print (number)

        

        
