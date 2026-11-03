const mongoose = require('mongoose');

const lokasiSchema = new mongoose.Schema({
  kelurahan: String,
  kecamatan: String,
}, { _id: false });

const articleSchema = new mongoose.Schema({
  judul: { type: String, required: [true, 'Judul wajib diisi'], trim: true },
  noLaporan: { type: String, required: [true, 'Nomor Laporan wajib diisi'], unique: true, trim: true },
  tingkatUrgensi: { type: Number, required: [true, 'Tingkat Urgensi wajib diisi'], min : 1 },
  status:{ type: String, required: [true, 'Status wajib diisi'] },
  lokasi: lokasiSchema,
  dinasId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Article', articleSchema);