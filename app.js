const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { promisify } = require('util');
const { createWriteStream } = require('fs');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/generate_pdf', async (req, res) => {
    const id_grup = req.body.id_grup;
    const id_bab = req.body.id_bab;
    const laman_awal = parseInt(req.body.laman_awal) || 0;
    const laman_akhir = parseInt(req.body.laman_akhir) || 1;

    const link = "https://reader-repository.upi.edu/index.php/display/img";
    const images = [];
    const canvas = createCanvas(210, 297);
    const ctx = canvas.getContext('2d');

    for (let laman = laman_awal; laman <= laman_akhir; laman++) {
        const url = `${link}/${id_grup}/${id_bab}/${laman}`;
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            if (response.status === 200 && response.headers['content-type'].startsWith('image')) {
                images.push(response.data);
            } else {
                console.log(`Failed to retrieve image from ${url}`);
                break;
            }
        } catch (error) {
            console.error(`Error fetching image from ${url}`, error);
            break;
        }
    }

    const tempFilePath = `./temp_${id_grup}_${id_bab}.pdf`;
    const outStream = fs.createWriteStream(tempFilePath);

    images.forEach((imageContent, index) => {
        loadImage(Buffer.from(imageContent)).then((image) => {
            ctx.drawImage(image, 0, 0, 210, 297);
            if (index !== images.length - 1) {
                pdf.addPage();
            }
        });
    });

    const stream = canvas.createPDFStream();
    stream.pipe(outStream);

    stream.on('finish', () => {
        res.download(tempFilePath, `${id_grup}_${id_bab}.pdf`, () => {
            // Cleanup temp file after download
            promisify(fs.unlink)(tempFilePath);
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

