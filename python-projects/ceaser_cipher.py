"""Caesar Cipher
Order: 2

Encrypt and decrypt messages using the ancient Caesar Cipher technique!
"""
logo = """           
 ,adPPYba, ,adPPYYba,  ,adPPYba, ,adPPYba, ,adPPYYba, 8b,dPPYba,  
a8"     "" ""     `Y8 a8P_____88 I8[    "" ""     `Y8 88P'   "Y8  
8b         ,adPPPPP88 8PP"""""""  `"Y8ba,  ,adPPPPP88 88          
"8a,   ,aa 88,    ,88 "8b,   ,aa aa    ]8I 88,    ,88 88          
 `"Ybbd8"' `"8bbdP"Y8  `"Ybbd8"' `"YbbdP"' `"8bbdP"Y8 88   
            88             88                                 
           ""             88                                 
                          88                                 
 ,adPPYba, 88 8b,dPPYba,  88,dPPYba,   ,adPPYba, 8b,dPPYba,  
a8"     "" 88 88P'    "8a 88P'    "8a a8P_____88 88P'   "Y8  
8b         88 88       d8 88       88 8PP""""""" 88          
"8a,   ,aa 88 88b,   ,a8" 88       88 "8b,   ,aa 88          
 `"Ybbd8"' 88 88`YbbdP"'  88       88  `"Ybbd8"' 88          
              88                                             
              88           
"""


alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x','y', 'z']


print(logo)
        

def ceaser(u_text, shift_n, direction):
	shift_text = ""
	for char in u_text:
		if char not in alphabet:
			shift_text += char
			continue
		idx = alphabet.index(char)
		if direction == 'encode':
			shift_text += alphabet[(idx + shift)%26]
			
		elif direction == 'decode':
			shift_text += alphabet[(idx - shift)%26]
			
	if direction == 'encode':
		print("here is your encoded result:")
	elif direction == 'decode':
		print("here is your decoded result:")
	print(shift_text)
	
user_choice = "yes"

while user_choice == "yes" :
	direction_u = input("Type 'encode' to encrypt, type 'decode' to decrypt: \n")
	text = input("Type  your message:\n").lower()
	shift = int(input("Type the shift number:\n"))
	list_text = list(text)
	ceaser(u_text = text, shift_n = shift, direction = direction_u)
	user_choice = input("do you want to run the code again ? /n")
	
	
