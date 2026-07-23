"""Advanced BMI Calculator
Order: 1

Calculates your Body Mass Index (BMI) and tells you your weight category (Underweight, Normal, Overweight, Obese, etc.).
"""
weight = float(input("enter your weight in kg: "))
hight = float(input("enter your hight in m: "))

bmi = (weight / hight**2)

if bmi < 18.5:
    print ("you are underweighted")
elif 18.5 < bmi <25:
    print ("you have a normal weight")
elif 25 < bmi < 30:
    print ("you are overweighted")
elif 30 < bmi <35:
    print ("you are obese")
else:
    print ("you are clinically obese")
