// seed.js
// Mengisi basis data dengan 3 kategori dan 25 artikel. Aman dijalankan berulang:
// data lama dihapus dulu.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const dinas = require('./models/dinasModel');
const laporan = require('./models/laporanModel');

const judul = [
    'Laporan A',
    'Laporan B',
    'Laporan C',
    'Laporan D',
    'Laporan E',
    'Laporan F',
    'Laporan G',
    'Laporan H',
    'Laporan I',
    'Laporan J',
    'Laporan K',
    'Laporan L',
    'Laporan M',
    'Laporan N',
    'Laporan O',
    'Laporan P',
    'Laporan Q',
];
const kecamatan = ['Kecamatan A', 'Kecamatan B', 'Kecamatan C', 'Kecamatan D'];
const kelurahan = [
  'Kelurahan A',
  'Kelurahan B',
  'Kelurahan C',
  'Kelurahan D',
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  await laporan.deleteMany({});
  await dinas.deleteMany({});

  const dinas = await dinas.insertMany([
    { kode: 'DPU', nama: 'Dinas Pekerjaan Umum' },
    { kode: 'DED', nama: 'Dinas Edukasi' },
    { kode: 'DKE', nama: 'Dinas Kebudayaan' },
  ]);

  const laporanData = judul.map((judul, i) => ({
    judul,
    noLaporan: String("LPR-" + (0o1 + i)),
    tingkatUrgensi: (i % 5) + 1,
    status: ['baru', 'proses', 'selesai'][i % 3],
    lokasi: {
      kecamatan: kecamatan[i % kecamatan.length],
      kelurahan: kelurahan[i % kelurahan.length],
    },
    dinasId: dinas[i % dinas.length]._id,
  }));
  await laporan.insertMany(laporanData);

  console.log(`Seed selesai: ${dinas.length} dinas, ${laporanData.length} laporan`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err.message); process.exit(1); });