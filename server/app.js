const express = require('express');
const axios = require('axios');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to download an image
const downloadImage = async (url, index) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });

        if (response && response.status === 200 && response.headers['content-type'].startsWith('image')) {
            return { data: response.data, index };
        } else {
            console.log(`Failed to retrieve image from ${url}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching image from ${url}: ${error.message}`);
        return null;
    }
};

// Function to create a PDF document
const createPDF = async (images) => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Add pages to the PDF in the correct order
    for (const imageData of images) {
        const image = await pdfDoc.embedPng(imageData.data);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

        const text = `Image ${imageData.index + 1}`;
        page.drawText(text, { x: 50, y: 50, font });
    }

    return pdfDoc;
};

app.get('/', (req, res) => {
    // Render HTML form for user input
    res.sendFile(__dirname + '/index.html');
});

// Route for generating PDF
app.post('/pdf', async (req, res) => {
    const id_grup = req.body.id_grup;
    const id_bab = req.body.id_bab;
    const laman_awal = parseInt(req.body.laman_awal) || 0;
    const laman_akhir = parseInt(req.body.laman_akhir) || 69;

    const link = "https://reader-repository.upi.edu/index.php/display/img";

    // Generate an array of Promises for all image requests
    const imageRequests = Array.from({ length: laman_akhir - laman_awal + 1 }, (_, i) => downloadImage(`${link}/${id_grup}/${id_bab}/${laman_awal + i}`, laman_awal + i));

    try {
        // Execute all image requests concurrently
        const imageDataArray = await Promise.all(imageRequests);

        // Filter out null values
        const validImageDataArray = imageDataArray.filter(imageData => imageData !== null);

        // Sort the array based on the laman value
        validImageDataArray.sort((a, b) => a.index - b.index);

        // Create a PDF document
        const pdfDoc = await createPDF(validImageDataArray);

        // Save PDF to file
        const pdfBytes = await pdfDoc.save();
        const pdfPath = `./${id_grup}_${id_bab}.pdf`;
        await fs.writeFile(pdfPath, pdfBytes);

        // Send the generated PDF as a response
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
    } catch (error) {
        console.error('Error in parallel image requests:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
