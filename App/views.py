# Contains the routes/controllers for the app

from flask import Blueprint, render_template, jsonify, send_from_directory, current_app
from transformers import pipeline
from sentence_transformers import SentenceTransformer
import os


views = Blueprint('views', __name__)

# serve json files from 'data' directory
@views.route('/data/<filename>')
def get_json_file(filename):
    return send_from_directory(os.path.join(current_app.root_path, 'data'), filename)

@views.route('/')
def index():
    testVar= 'Hello from python'
    # /Users/suchi/Personal/UiS/Bachelor/Data/data/sph

    # stm - transcript
    # sph - audio

    #model_1 = 'sentence-transformers/all-MiniLM-L6-v2'
    #model_2 = 'bert-base-nli-mean-tokens'
    #model = SentenceTransformer(model_2)
    sentences_0 = [
                    "The weather is lovely today.",
                    "It's so sunny outside!",
                    "He drove to the stadium."
                ]
    
    sentences = []



    #embeddings = model.encode(sentences_0)
    #similarities = model.similarity(embeddings, embeddings)
    #result = similarities

    # !-- DUMMY --!
    dummyData = []

    return render_template("index.html", testContent = testVar, testResult = "TEST")