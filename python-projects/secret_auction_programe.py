"""Secret Auction Program
Order: 12

Run a blind auction! Each person enters their bid secretly, and the program announces the highest bidder at the end.
"""
import os

def clear():
    # 'nt' is for Windows, 'posix' is for macOS and Linux
    os.system('cls' if os.name == 'nt' else 'clear')




print('''
                         ___________
                         \         /
                          )_______(
                          |"""""""|_.-._,.---------.,_.-._
                          |       | | |               | | ''-.
                          |       |_| |_             _| |_..-'
                          |_______| '-' `'---------'` '-'
                          )"""""""(
                         /_________\
                         `'-------'`
                       .-------------.
                   jgs/_______________\
''')


print("Welcome to the Secret Auction Programe")

name = input("What is your name? \n")
bid = int(input("What's your bid? $"))
dictionary = {name : bid}
choice = input("Are there any other bidders? \n")


while choice == "yes":
    clear()
    name = input("What is your name? \n")
    bid = int(input("What's your bid? \n"))
    dictionary[name] = bid
    choice = input("Are there any other bidders? \n")

print(dictionary)    

max_value = 0
max_key = ""
for key in dictionary:
    if dictionary[key] > max_value:
        max_value = dictionary[key]
        max_key = key
print(f"Winner is {max_key} whose bid ammount is {max_value}")

