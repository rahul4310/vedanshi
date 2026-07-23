"""Pizza Order System
Order: 7

An automated pizza ordering system that calculates your final bill based on size, extra cheese, and corn.
"""
print("Welcome to the pizza dieliveries!")
bill = 0
size = input("what size pizza do you like? s, m or l: ")
add_corn = input("do you like corn? y or n :  ")
extra_cheese = input("do you like extra cheese? y or n :  ")

if size == "s":
    print ("small pizza = $15")
    bill = 15
    if add_corn == "y":
        print("corn for a small pizza = + $2")
        bill += 2
elif size =="m":
    print ("medium pizza = $20")
    bill = 20
    if add_corn == "y":
        print ("corn for a medium pizza = $3")
        bill += 3
else:
    print ("large pizza = $25")
    bill = 25
    if add_corn == "y":
        print ("corn for a large pizza = $3")
        bill += 3


if extra_cheese == "y":
    print("extra cheese = $1")
    bill += 1


print (f"your final bill = ${bill}")

