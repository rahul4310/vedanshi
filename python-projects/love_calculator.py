"""Love Calculator
Order: 6

Find out your compatibility score with your crush! This fun program calculates a score based on the letters in your names.
"""
print("welcome to the love calculator")
name_one = input("Enter your name: ")
name_two = input ("Enter your name: ")

lower_one = name_one.lower()
lower_two = name_two.lower()


    
t_one = lower_one.count("t")
t_two = lower_two.count("t")

r_one = lower_one.count("r")
r_two = lower_two.count("r")

u_one = lower_one.count("u")
u_two = lower_two.count("u")

e_one = lower_one.count("e")
e_two = lower_two.count("e")



l_one = lower_one.count("l")
l_two = lower_two.count("l")

o_one = lower_one.count("o")
o_two = lower_two.count("o")

v_one = lower_one.count("v")
v_two = lower_two.count("v")

E_one = lower_one.count("e")
E_two = lower_two.count("e")



true = (t_one + t_two + r_one + r_two + u_one + u_two + e_one + e_two)
love = (l_one + l_two + o_one + o_two + v_one + v_two + E_one + E_two)

true_ten = (true * 10)


true_love = (true_ten + love)



if true_love > 90 or true_love < 10:
    print (f"your score is {true_love}%, you go together like coke and mentos")
elif 40 <true_love <50:
    print(f"your score is {true_love}%, you are alright together ")
else:
    print(f"your score is {true_love}%")


