"""Rock, Paper, Scissors
Order: 10

Play the classic game of Rock, Paper, Scissors against the computer. Complete with ASCII art graphics!
"""
import random
user = int(input("What do you choose? type 0 for rock, 1 for paper or 2 for sissor"))
computer = random.randint(0,2)

if user == 0:
    print('''
    _______
---'   ____)
      (_____)
      (_____)
      (____)
---.__(___)

''')

    print ("Computer choose:")
    if computer == 0:
        print('''
    _______
---'   ____)
      (_____)
      (_____)
      (____)
---.__(___)

''')
        print("rock")
        print("it's a draw")
    elif computer == 1:
        print('''
   _________
---'    ____)____
           ______)
          _______)
         _______)
---.__________)

''')
        print("paper")
        print("you lost!")
    else:
        print('''
    _______
---'   ____)____
          ______)
       __________)
      (____)
---.__(___)

''')
        print("sissor")
        print("you won!")

#________________________________________________________________________________


elif user == 1:
    print('''
    ________
---'    ____)____
           ______)
          _______)
         _______)
---.__________)
    

''')

    print ("Computer choose:")
    if computer == 0:
        print('''
    _______
---'   ____)
      (_____)
      (_____)
      (____)
---.__(___)

''')
        print("rock")
        print("you won!")
    elif computer == 1:
        print('''
   _________
---'    ____)____
           ______)
          _______)
         _______)
---.__________)

''')
        print("paper")
        print("it's a draw")
    else:
        print('''
    _______
---'   ____)____
          ______)
       __________)
      (____)
---.__(___)

''')
        print("sissor")
        print("you lost!")

#________________________________________________________________________

if user == 2:
    print('''

    _______
---'   ____)____
          ______)
       __________)
      (____)
---.__(___)

''')


    print ("Computer choose:")
    if computer == 0:
        print('''
    _______
---'   ____)
      (_____)
      (_____)
      (____)
---.__(___)

''')
        print("rock")
        print("you lost!")
    elif computer == 1:
        print('''
   _________
---'    ____)____
           ______)
          _______)
         _______)
---.__________)

''')
        print("paper")
        print("you won!")
    else:
        print('''
    _______
---'   ____)____
          ______)
       __________)
      (____)
---.__(___)

''')
        print("sissor")
        print("its a draw")
#_____________________________________________________________________________



    
    






