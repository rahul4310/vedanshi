"""Turtle Drawing (Broken)
Order: 3
Demo: true

This program tries to use the turtle graphics library, which doesn't work in the browser!
"""

import turtle

t = turtle.Turtle()
for _ in range(4):
    t.forward(100)
    t.right(90)
    
turtle.done()
