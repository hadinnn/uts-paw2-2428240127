const laporan = require('../models/laporanModel');
const dinas = require('../models/dinasModel');
const { errorHttp } = require('../middlewares/errorHandler');

const LIMIT_DEFAULT = 10;
const LIMIT_MAKS = 50;
const FIELD_SORT = ['judul', 'noLaporan', 'createdAt'];
const FIELD_BOLEH_DIPILIH = ['judul', 'noLaporan', 'tingkatUrgensi', 'status', 'lokasi', 'dinasId', 'createdAt'];

// Mengubah bilangan dari query string menjadi bilangan bulat yang aman
function angkaAman(nilai, bawaan, min, maks) {
  const n = parseInt(nilai, 10);
  if (Number.isNaN(n)) return bawaan;
  return Math.min(Math.max(n, min), maks);
}

exports.create = async (req, res) => {
    const { judul, noLaporan, tingkatUrgensi, status, lokasi, dinasId } = req.body;
    const laporan = await laporan.create({ judul, noLaporan, tingkatUrgensi, status, lokasi, dinasId });
    res.status(201).json(laporan);
};

exports.getAll = async (req, res) => {
  // 1. Filtering
   const filter = {};
  if (req.query.kecamatan) {
    filter['lokasi.kecamatan'] = String(req.query.kecamatan);
  }
  if (req.query.dinas) {
    const dinas = await dinas.findOne({ kode: String(req.query.dinas).toUpperCase() });
    // Kode kategori tidak dikenal -> hasil kosong ($in: [] tidak cocok dengan apa pun)
    filter.dinasId = dinas ? dinas._id : { $in: [] };
  }
  // 2. Pagination dengan batas maksimum
   const page = angkaAman(req.query.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = angkaAman(req.query.limit, LIMIT_DEFAULT, 1, LIMIT_MAKS);

  // Sorting: ?sort=judul (naik) atau ?sort=-judul (turun). Bawaan: terbaru dulu
  // 3. Sorting: ?sort=judul (naik) atau ?sort=-judul (turun). Bawaan: terbaru dulu
  const sortParam = String(req.query.sort || '-createdAt');
  const arah = sortParam.startsWith('-') ? -1 : 1;
  const sortField = sortParam.replace(/^-/, '');
  if (!FIELD_SORT.includes(sortField)) {
    throw errorHttp(400, `sort hanya boleh: ${FIELD_SORT.join(', ')}`);
  }

  let select = '';
  if (req.query.fields) {
    const fields = String(req.query.fields).split(',').map((f) => f.trim());
    if (!fields.every((f) => FIELD_BOLEH_DIPILIH.includes(f))) {
      throw errorHttp(400, `fields hanya boleh: ${FIELD_BOLEH_DIPILIH.join(', ')}`);
    }
    select = fields.join(' ');
  }

    const query = laporan.find(filter)
    .select(select)
    .sort({ [sortField]: arah, _id: 1 })
    .skip((page - 1) * limit)
    .limit(limit);


  if (!select || select.split(' ').includes('dinasId')) {
    query.populate('dinasId', 'kode nama');
  }

  const [data, total] = await Promise.all([query, laporan.countDocuments(filter)]);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
};

exports.getById = async (req, res) => {
  const data = await laporan.findById(req.params.id).populate('dinasId');
  if (!data) throw errorHttp(404, 'Data tidak ditemukan');
  res.json(data);
};

exports.update = async (req, res) => {
  const { judul, nolaporan, tingkatUrgensi, status,  lokasi, dinasId } = req.body;
  const data = await laporan.findByIdAndUpdate(
    req.params.id,
    { judul, nolaporan, tingkatUrgensi, status, lokasi, dinasId },
    { returnDocument: 'after', runValidators: true }
  );
  if (!data) throw errorHttp(404, 'Data tidak ditemukan');
  res.json(data);
};

exports.remove = async (req, res) => {
  const data = await laporan.findByIdAndDelete(req.params.id);
  if (!data) throw errorHttp(404, 'Data tidak ditemukan');
  res.status(204).send();
};