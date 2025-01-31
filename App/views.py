# Contains the routes/controllers for the app

from flask import Blueprint, render_template, jsonify

views = Blueprint('views', __name__)

@views.route('/')
def index():
    testVar= 'Hello from python!'
    testVar2= 'Second greeting...! hehe'

    node1 = 'Node 1'
    node2 = 'Node 2'
    node3 = 'Node 3'

    # /Users/suchi/Personal/UiS/Bachelor/Data/data/sph

    return render_template("index.html", testContent = testVar, test2 = testVar2, node1 = node1, node2 = node2, node3 = node3)