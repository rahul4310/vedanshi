# Program B: tries to use variable from Program A
try:
    print("secret =", secret)
    print("ERROR: Variable leaked between runs!")
except NameError:
    print("PASS: Variable 'secret' is not defined (fresh globals work)")
