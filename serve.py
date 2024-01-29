import os
import webbrowser
from threading import Timer
from flask import Flask, request, jsonify
from bs4 import BeautifulSoup
import requests
import json

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/summarize', methods=['POST'])
def summarize():
    # Get the URL from the form
    url = request.form['url']
    
    # Scrape the URL for text
    page_response = requests.get(url)
    page_content = BeautifulSoup(page_response.content, "html.parser")
    texts = page_content.stripped_strings
    full_text = ' '.join(texts)
    
    # Send the scraped text to OpenRouter API for summarization
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": "Bearer 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",
        },
        data=json.dumps({
            "model": "mistralai/mistral-7b-instruct",
            "messages": [
                {"role": "system", "content": "The user will provide you with a long peice of text from a website to summarise. Your job is to take that long garbled text and summarise it in a clean, readable and concise manner for the user, which HAS to be under 500-600 words. Only and ONLY reply with the clean and synthesized summary and no other preamble, greeting or goodbye."},
                {"role": "user", "content": "Summarise this for me please: "+ full_text}
            ]
        })
    )
    # Extract the bot's message from the response
    bot_message = response.json()['choices'][0]['message']['content']
    
    # Return only the bot's message
    return jsonify({"message": bot_message})

def open_browser():
      webbrowser.open_new('http://127.0.0.1:5000/')

print(4)

if __name__ == '__main__':
    Timer(1, open_browser).start()
    app.run(port=5000)