from flask import Flask
from flask import render_template
from openai import OpenAI
client = OpenAI()

app = Flask(__name__)


@app.route('/speech-to-email')
def speechtoemail():
    return render_template('speechtoemail.html')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_audio():
    audio_file = request.files['audioFile']
    file_path = os.path.join('static\\files', audio_file.filename)
    audio_file.save(file_path)  # Save the file

    # Transcription logic
    transcript = transcribe_audio(file_path)  # Ensure transcribe_audio takes a file path argument

    return jsonify({'message': 'File uploaded successfully', 'transcript': transcript})

def transcribe_audio(file_path):
    with open(file_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1", 
            file=audio_file,
            response_format="text"
        )
    return transcript
