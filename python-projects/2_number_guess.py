"""Number Guessing Game
Order: 2
Demo: true

Try to guess the secret number in 3 tries!
"""

secret = 7
print("I'm thinking of a number between 1 and 10.")
print("You have 3 tries to guess it!\n")

for attempt in range(1, 4):
    try:
        guess = int(input(f"Attempt {attempt} - Your guess: "))
        if guess == secret:
            print("🎉 You guessed it! You win!")
            break
        elif guess < secret:
            print("Too low!")
        else:
            print("Too high!")
    except ValueError:
        print("Please enter a valid number.")

else:
    print(f"\nGame Over! The secret number was {secret}.")
