from flask import Flask, request
from subprocess import call
import base64
import vinepy, time
import os
app = Flask(__name__, static_url_path='', static_folder='')
api = vinepy.API(username="wineclient@suremail.info", password="password", DEBUG=True)

@app.route('/')
def root():
  print request
  return app.send_static_file('index.html')

@app.route('/upload', methods=['POST'])
def upload():
  if request.method == 'POST':
    video_data = request.form.get('base64webm')
    audio_data = request.form.get('base64wav')
    video_filename = 'process/vine_fragment.webm'
    audio_filename = 'process/vine_fragment.wav'

    if video_data:
      save_base64(video_filename, video_data)
    if audio_data:
      save_base64(audio_filename, audio_data)

    call(['ffmpeg', '-i', audio_filename, '-i', video_filename, '-c:v', 'libx264', '-r', '30', '-pix_fmt',  'yuv420p', '-y', 'process/output.mp4'])
    shareUrl = vine_upload(request.form.get('title'))
    return shareUrl

def save_base64(filename, base64_data):
  base64_string = base64_data.split(',')[1]
  base64_body = base64.urlsafe_b64decode(str(base64_string))
  with open(os.path.join(os.path.dirname(os.path.realpath(__file__)), filename), 'wb') as f:
    f.write(base64_body)
  f.close()

def vine_upload(title):
  video_filename = 'process/output.mp4'
  thumb_filename = 'process/thumbnail.jpg'

  videoUrl = api.upload_video(filename=video_filename)
  thumbUrl = api.upload_thumb(filename=thumb_filename)
  description = time.strftime(title or "%I:%M:%S %d/%m/%Y")

  post = api.post(videoUrl=videoUrl, thumbnailUrl=thumbUrl, description=description, entities=[])
  share_url = 'https://vine.co/v/' + vinepy.post_short_id(post.id)
  return share_url


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
