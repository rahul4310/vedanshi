"""Rollercoaster Ticket System
Order: 11

A theme park ticket calculator that takes your height and age to determine if you can ride and how much your ticket costs.
"""
print ("welcome to the rollercoaster ride")
hight = int(input("enter youe hight in cm: "))
bill = 0

if hight >= 120:
    print("you can ride rollercoaster")
    age = int(input("enter your age: "))
    if age < 12:
        print("child ticket are $5")
        bill = 5
    elif age <= 18:
        print("youth ticket are $7")
        bill = 7
    elif age > 45 and age < 50:
        print("everything is going to be ok . have a free ride!")
    else:
        print ("adult ticket are $12")
        bill = 12


    photos = input("would you like to take photos: ")
    if photos == ("yes"):
        print("pay $7 more")
        bill += 7
        print(f"so, your total bill would be ${bill}")
    elif photos == ("no"):
        print ("  ")
    else:
        print("error , you should answer only in yes or no")
else:
    print("sorry you have to grow more taller before you can ride")

    
    
        
        
            
