# UPI Repository Downloader

## Overview

Skrip Python ini digunakan untuk mengunduh gambar dari UPI Repository berdasarkan input pengguna dan mengompilasinya menjadi file PDF.

## Persyaratan

- Python 3.x
- Library `requests`, `PIL`, dan `fpdf` (instal dengan perintah `pip install requests Pillow fpdf`)

## Penggunaan

1. Jalankan skrip dengan mengetik `python downloader.py` di terminal.
2. Ikuti petunjuk untuk memberikan informasi yang diperlukan:
   - ID File Skripsi (ID file tesis)
   - ID Bab/File (ID bab/file)
   - Halaman awal (tekan Enter untuk memulai dari halaman pertama)
   - Halaman akhir
3. Skrip akan mengunduh gambar dari URL yang ditentukan dan mengkompilasikannya ke dalam file PDF bernama "Output.pdf" di direktori saat ini.

## Catatan Tambahan

- Jika halaman awal dikosongkan (menekan Enter), akan default ke halaman 0.
- Skrip dapat mencetak peringatan jika gagal mengambil gambar dari URL tertentu.

