const express = require('express');
const axios = require('axios');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    // Render HTML form for user input
    res.sendFile(__dirname + '/index.html');
});

app.post('/', async (req, res) => {
    const id_grup = req.body.id_grup;
    const id_bab = req.body.id_bab;
    const laman_awal = parseInt(req.body.laman_awal) || 0;
    const laman_akhir = parseInt(req.body.laman_akhir) || 69;

    const link = "https://reader-repository.upi.edu/index.php/display/img";
    const pdfDoc = await PDFDocument.create();
    let failedImages = 0;  // Counter for failed image requests

    for (let laman = laman_awal; laman <= laman_akhir; laman++) {
        const url = `${link}/${id_grup}/${id_bab}/${laman}`;

        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });

            if (response.status === 200 && response.headers['content-type'].startsWith('image')) {
                const image = await pdfDoc.embedPng(response.data);
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            } else {
                console.log(`Failed to retrieve image from ${url}`);
                failedImages++;

                if (failedImages >= 3) {
                    console.log(`Stopping loop after 3 consecutive failed image requests`);
                    break;
                }
            }
        } catch (error) {
            console.error(`Error fetching image from ${url}: ${error.message}`);
            failedImages++;

            if (failedImages >= 3) {
                console.log(`Stopping loop after 3 consecutive failed image requests`);
                break;
            }
        }
    }

    const pdfBytes = await pdfDoc.save();

    const pdfPath = `./${id_grup}_${id_bab}.pdf`;
    await fs.writeFile(pdfPath, pdfBytes);

    res.download(pdfPath, `${id_grup}_${id_bab}.pdf`, (err) => {
        if (err) {
            console.error(`Error sending file: ${err.message}`);
        }

        // Cleanup: Remove the temporary PDF file
        fs.unlink(pdfPath, (err) => {
            if (err) {
                console.error(`Error deleting file: ${err.message}`);
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
