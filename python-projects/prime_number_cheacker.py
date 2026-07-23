"""Prime Number Checker
Order: 8

A mathematical utility that efficiently checks whether any given number is a prime number.
"""
import math

def prime_checker(number):
    prime_flag = True
    root_n = int(math.sqrt(number))
    for i in range(2, root_n + 1):
        if number % i == 0:
            # this implies i is a factor of number and thus it is not a prime number
            prime_flag = False
            break # no need to check further as we got a factor

    if prime_flag:
        print("prime number")
    else:
        print("not a prime number")

while True:
    n = int(input("check this number"))
    prime_checker(number = n)
            
        
