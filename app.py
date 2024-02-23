from flask import Flask, render_template, request, send_file
from PIL import Image
from fpdf import FPDF
import io
import tempfile
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_pdf', methods=['POST'])
def generate_pdf():
    id_grup = request.form['id_grup']
    id_bab = request.form['id_bab']

    laman_awal_str = request.form.get('laman_awal', '')
    laman_awal = int(laman_awal_str) if laman_awal_str.isdigit() else 0

    laman_akhir_str = request.form.get('laman_akhir', '')
    laman_akhir = int(laman_akhir_str) if laman_akhir_str.isdigit() else 69

    link = "https://reader-repository.upi.edu/index.php/display/img"
    images = []
    pdf = FPDF()

    for laman in range(laman_awal, laman_akhir + 1):
        url = f"{link}/{id_grup}/{id_bab}/{laman}"
        response = requests.get(url)

        if response.status_code == 200 and response.headers.get('content-type', '').startswith('image'):
            images.append(response.content)
        else:
            print(f"Failed to retrieve image from {url}")
            break  # Stop fetching images if an error occurs

    for i, image_content in enumerate(images):
        pdf.add_page()
        temp_image = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        temp_image_path = temp_image.name
        temp_image.write(image_content)
        temp_image.close()

        image = Image.open(temp_image_path)
        jpeg_image = Image.new("RGB", image.size, (255, 255, 255))
        jpeg_image.paste(image, (0, 0), image)
        jpeg_image.save(temp_image_path, "JPEG")

        pdf.image(temp_image_path, x=0, y=0, w=210, h=297)

    # Save PDF content to a temporary file
    temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_pdf_path = temp_pdf.name
    pdf.output(temp_pdf_path)
    temp_pdf.close()

    return send_file(temp_pdf_path, download_name=f"{id_grup}_{id_bab}.pdf", as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
