"""Bank Roulette
Order: 15

Enter the names of everyone at the table, and this program will randomly select who has to pay the bill!
"""
names_string = input("Give me everybody's name, seperated by a coma.  ")
names = names_string.split(", ")
import random

len_names = len(names)
random_names = random.randint(0,len_names - 1)
print(names[random_names])


