"""Treasure Map
Order: 14

An interactive 3x3 grid map where you can specify coordinates to bury your treasure!
"""
row1 = ["☐","☐","☐"]
row2 = ["☐","☐","☐"]
row3 = ["☐","☐","☐"]

map = [row1,row2,row3]
print(f"{row1}\n{row2}\n{row3}")

position = input("Where do you want to put treasure")

x_pos = int(position[0])
y_pos = int(position[1])
map[y_pos-1][x_pos-1] = "X"


print(f"{row1}\n{row2}\n{row3}")
