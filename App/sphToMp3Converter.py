import os
import subprocess

input_folder = "/Users/suchi/Personal/UiS/Bachelor/Project/Speech_Collection_Navigation_Graph.v1/App/data/sourceData/sph"
output_folder = "/Users/suchi/Personal/UiS/Bachelor/Project/Speech_Collection_Navigation_Graph.v1/App/static/audio"
os.makedirs(output_folder, exist_ok=True)


def convert_sph_to_mp3(input_sph, output_mp3):
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", input_sph, "-acodec", "libmp3lame", "-b:a", "192k", output_mp3],
            check=True
        )        
    except subprocess.CalledProcessError as error:
        print(f"{error}")


for fname in os.listdir(input_folder):
    if fname.endswith(".sph"):
        input_path = os.path.join(input_folder, fname)
        output_path = os.path.join(output_folder, fname.replace(".sph", ".mp3"))

        convert_sph_to_mp3(input_path, output_path)