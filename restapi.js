const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mysql = require("mysql");
const base64 = require("base-64");
const cors = require("cors");
const PublikFungsi = require("./PublikFungsi");
const Token = require("./Token");
const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");
const utf8 = require("utf8");
const fetch = require("node-fetch");
const tulisIniFile = require("write-ini-file");
const bacaIniFile = require("read-ini-file");
const cron = require("node-cron");

// parse application/json
app.use(cors());
app.use(express.urlencoded({
  extended:false, limit: '16gb'
}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '16gb'
}));

//create database connection
class Konfigurasi {
  dbConfig = {
    port: 3306,
    host: "localhost",
    user: "root",
    password: "",
    database: "daftar_berobat",
  };
}
var konfigDB = new Konfigurasi;
var platformOS = process.platform;
var conn = mysql.createConnection(konfigDB.dbConfig);
const tetapAktif = () => {
  console.log("Mengaktifkan perintah selalu terhubung...");
  const sql = 'SELECT CONCAT(NOW(), " : Terhubung") AS cek';
  const data = null;
  try {
    conn.query(sql, data, (err, results) => {
      if (err) {
        console.log(err);
      } else {
        console.log(results[0].cek);
      }
    });
  } catch (error) {
    hendelKoneksi();
  }
};

//connect to database
var hendelKoneksi = function () {
  conn = mysql.createConnection(konfigDB.dbConfig);
  conn.connect(function onConnect(err) {
    if (err) {
      //
      console.log("Sambungan Terputus dengan pesan : " + err);
      setTimeout(() => {
        console.log("Mencoba Menyambungkan Ulang....");
        hendelKoneksi;
        console.log("MySQL/MariaDB Terhubung Kembali.");
      }, 10000);
    } else {
      console.log("MySQL/MariaDB Terhubung dengan id : " + conn.threadId);
    }
    console.log("Berjalan pada Platform : " + platformOS);
  });

  conn.on("error", function onError(err) {
    console.log("DB Error : ", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      if (platformOS === "linux") {
        exec("/opt/lampp/xampp start");
      }
      hendelKoneksi();
    } else if (err.code === "ECONNRESET") {
      hendelKoneksi();
    } else if (err.code === "ECONNREFUSED") {
      hendelKoneksi();
    } else {
      console.log("DB Error : ", err);
    }
  });
};

app.post("/api/cek_token", (req, res) => {
  console.log("Cek Token");
  let data = {
    token: req.body.token,
    hostname: req.hostname,
    ipnya: req.ip,
    jam_request: PublikFungsi.WaktuSekarang("DD MMMM YYYY HH:mm:ss") + " Wib.",
  };
  let token = data.token;
  res.setHeader("Content-Type", "application/json");
  if (token) {
    if (Token.LoginToken(token)) {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Benar.",
          tokennyaa: "Hidden",
          error: null,
          jumlah_data: 1,
          data: [],
        })
      );
    }
    else{
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Tokennya Salah.",
          tokennyaa: Token.TokenRahasia(),
          error: null,
          jumlah_data: 1,
          data: [],
        })
      );
    }
  }
  else{
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Tokennya Masih Kosong!",
        tokennyaa: "Hidden",
        error: null,
        jumlah_data: 1,
        data: [],
      })
    );
  }
  console.log(data);
});

//Pasien
app.post("/api/tampil_pasien", (req, res) => {
  console.log("Tampil Pasien");
  let data = {
    token: req.body.token,
    input_cari: req.body.input_cari,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_pasien';
  let nama_field = '*';
  let kondisi = '';
  if (data.input_cari) {
    kondisi+= 'WHERE nomr LIKE "%' + data.input_cari + '%" ';
    kondisi+= 'OR namapasien LIKE "%' + data.input_cari + '%" ';
    kondisi+= 'OR nohp LIKE "%' + data.input_cari + '%" ';
    kondisi+= 'ORDER BY nomr ASC';
  }
  else{
    kondisi = 'ORDER BY nomr ASC';
  }
  try {
    sql = PublikFungsi.CariDataDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.CariDataDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
    console.log('Erorr Sistem : ' + error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error.",
              status_tampil: false,
              tokennyaa: "Hidden",
              error: err,
              jumlah_data: 0,
              data: results,
            })
          );
        } else {
          if (results.length > 0) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Datanya ada.",
                status_tampil: true,
                tokennyaa: "Hidden",
                error: null,
                jumlah_data: results.length,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Belum Ada datanya.",
                status_tampil: false,
                tokennyaa: "Hidden",
                error: null,
                jumlah_data: results.length,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_tampil: false,
          tokennyaa: data["token"],
          error: null,
          jumlah_data: 0,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_tampil: false,
        tokennyaa: data["token"],
        error: null,
        jumlah_data: 0,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/tambah_pasien", (req, res) => {
  console.log("Tambah pasien");
  let data = {
    token: req.body.token,
    nomr : req.body.nomr,
    namapasien : req.body.namapasien,
    jeniskelamin : req.body.jeniskelamin,
    tgllahir : req.body.tgllahir,
    alamat : req.body.alamat,
    nohp : req.body.nohp,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_pasien';
  let nama_field = 'nomr,namapasien,jeniskelamin,tgllahir,alamat,nohp';
  let value_field = '"' + data.nomr + '",';
  value_field += '"' + data.namapasien + '",';
  value_field += '"' + data.jeniskelamin + '",';
  value_field += '"' + data.tgllahir + '",';
  value_field += '"' + data.alamat + '",';
  value_field += '"' + data.nohp + '"';

  try {
    sql = PublikFungsi.SimpanSingleDebug(
      nama_tabel,
      nama_field,
      value_field
    );
  } catch (error) {
    sql = PublikFungsi.SimpanSingleDebug(
      nama_tabel,
      nama_field,
      value_field
    );
    console.log('Erorr Sistem : ' + error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code Tambah Pasien.",
              status_tambah: false,
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          let affectedRows = results.affectedRows;
          if (affectedRows = 1) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Tambah Pasien Sukses.",
                status_tambah: true,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Tambah Pasien Error.",
                status_tambah: false,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_tambah: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_tambah: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/ubah_pasien", (req, res) => {
  console.log("Ubah Pasien");
  let data = {
    token: req.body.token,
    nomr : req.body.nomr,
    namapasien : req.body.namapasien,
    jeniskelamin : req.body.jeniskelamin,
    tgllahir : req.body.tgllahir,
    alamat : req.body.alamat,
    nohp : req.body.nohp,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_pasien';

  let nama_field = 'namapasien = "' + data.namapasien + '",';
  nama_field += 'jeniskelamin = "' + data.jeniskelamin + '",';
  nama_field += 'tgllahir = "' + data.tgllahir + '",';
  nama_field += 'alamat = "' + data.alamat + '",';
  nama_field += 'nohp = "' + data.nohp + '"';

  let kondisi = 'nomr = "' + data.nomr + '"';

  try {
    sql = PublikFungsi.UbahDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.UbahDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
    console.log(error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code Ubah Pasien.",
              status_ubah: false,
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          let affectedRows = results.affectedRows;
          if (affectedRows = 1) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Ubah Pasien Sukses.",
                status_ubah: true,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Ubah Pasien Error.",
                status_ubah: false,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_ubah: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_ubah: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/hapus_pasien", (req, res) => {
  console.log("Hapus Pasien");
  let data = {
    token: req.body.token,
    nomr : req.body.nomr,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_pasien';
  let kondisi = 'nomr = "' + data.nomr + '"';

  try {
    sql = PublikFungsi.HapusDebug(
      nama_tabel,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.HapusDebug(
      nama_tabel,
      kondisi
    );
    console.log(error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code. Hapus Pasien.",
              status_hapus: false,
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          let affectedRows = results.affectedRows;
          if (affectedRows = 1) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Hapus Pasien Sukses.",
                status_hapus: true,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Hapus Pasien Error.",
                status_hapus: false,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_hapus: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_hapus: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

//Staff
app.post("/api/tampil_staff", (req, res) => {
  console.log("Tampil Staff");
  let data = {
    token: req.body.token,
    input_cari: req.body.input_cari,
    jabatanstaff: req.body.jabatanstaff,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_staff';
  let nama_field = '*';
  let kondisi = '';
  if (data.input_cari) {    
    if (data.jabatanstaff){
      kondisi += 'WHERE jabatanstaff = "' + data.jabatanstaff + '" ';
      kondisi += 'AND (namastaff LIKE "%' + data.input_cari + '%" ';
      kondisi += 'OR jabatanstaff LIKE "%' + data.input_cari + '%") ';
      kondisi += 'ORDER BY namastaff ASC';
    }
    else{
      kondisi += 'WHERE namastaff LIKE "%' + data.input_cari + '%" ';
      kondisi += 'OR jabatanstaff LIKE "%' + data.input_cari + '%" ';
      kondisi += 'ORDER BY kodestaff ASC';
    }
  }
  else{
    if (data.jabatanstaff){
      kondisi += 'WHERE jabatanstaff = "' + data.jabatanstaff + '" ';
      kondisi += 'ORDER BY namastaff ASC';
    }
    else{
      kondisi = 'ORDER BY kodestaff ASC';
    }
  }
  try {
    sql = PublikFungsi.CariDataDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.CariDataDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
    console.log('Erorr Sistem : ' + error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error.",
              status_tampil: false,
              tokennyaa: "Hidden",
              error: err,
              jumlah_data: 0,
              data: results,
            })
          );
        } else {
          if (results.length > 0) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Datanya ada.",
                status_tampil: true,
                tokennyaa: "Hidden",
                error: null,
                jumlah_data: results.length,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Belum Ada datanya.",
                status_tampil: false,
                tokennyaa: "Hidden",
                error: null,
                jumlah_data: results.length,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_tampil: false,
          tokennyaa: data["token"],
          error: null,
          jumlah_data: 0,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_tampil: false,
        tokennyaa: data["token"],
        error: null,
        jumlah_data: 0,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/tambah_staff", (req, res) => {
  console.log("Tambah Staff");
  let data = {
    token: req.body.token,
    kodestaff : req.body.kodestaff,
    namastaff : req.body.namastaff,
    jabatanstaff : req.body.jabatanstaff,
    namapengguna : req.body.namapengguna,
    tgllahirstaff : req.body.tgllahirstaff,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_staff';
  let nama_field = 'kodestaff,namastaff,jabatanstaff,namapengguna,tgllahirstaff';
  let value_field = '"' + data.kodestaff + '",';
  value_field += '"' + data.namastaff + '",';
  value_field += '"' + data.jabatanstaff + '",';
  value_field += '"' + data.namapengguna + '",';
  value_field += '"' + data.tgllahirstaff + '"';

  try {
    sql = PublikFungsi.SimpanSingleDebug(
      nama_tabel,
      nama_field,
      value_field
    );
  } catch (error) {
    sql = PublikFungsi.SimpanSingleDebug(
      nama_tabel,
      nama_field,
      value_field
    );
    console.log('Erorr Sistem : ' + error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code Tambah Staff.",
              status_tambah: false,
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          let affectedRows = results.affectedRows;
          if (affectedRows = 1) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Tambah Staff Sukses.",
                status_tambah: true,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Tambah Staff Error.",
                status_tambah: false,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_tambah: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_tambah: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/ubah_staff", (req, res) => {
  console.log("Ubah Staff");
  let data = {
    token: req.body.token,
    kodestaff : req.body.kodestaff,
    namastaff : req.body.namastaff,
    jabatanstaff : req.body.jabatanstaff,
    namapengguna : req.body.namapengguna,
    tgllahirstaff : req.body.tgllahirstaff,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_staff';

  let nama_field = 'namastaff = "' + data.namastaff + '",';
  nama_field += 'jabatanstaff = "' + data.jabatanstaff + '",';
  nama_field += 'namapengguna = "' + data.namapengguna + '",';
  nama_field += 'tgllahirstaff = "' + data.tgllahirstaff + '"';

  let kondisi = 'kodestaff = "' + data.kodestaff + '"';

  try {
    sql = PublikFungsi.UbahDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.UbahDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
    console.log(error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code Ubah Staff.",
              status_ubah: false,
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          let affectedRows = results.affectedRows;
          if (affectedRows = 1) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Ubah Staff Sukses.",
                status_ubah: true,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Ubah Staff Error.",
                status_ubah: false,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_ubah: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_ubah: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/hapus_staff", (req, res) => {
  console.log("Hapus Staff");
  let data = {
    token: req.body.token,
    kodestaff : req.body.kodestaff,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_staff';
  let kondisi = 'kodestaff = "' + data.kodestaff + '"';

  try {
    sql = PublikFungsi.HapusDebug(
      nama_tabel,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.HapusDebug(
      nama_tabel,
      kondisi
    );
    console.log(error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code. Hapus Staff.",
              status_hapus: false,
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          let affectedRows = results.affectedRows;
          if (affectedRows = 1) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Hapus Staff Sukses.",
                status_hapus: true,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Hapus Staff Error.",
                status_hapus: false,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_hapus: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_hapus: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

//Berobat
app.post("/api/tampil_berobat", (req, res) => {
  console.log("Tampil Berobat");
  let data = {
    token: req.body.token,
    input_cari: req.body.input_cari,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_berobat a ';
  nama_tabel += 'LEFT JOIN tb_pasien b ON a.nomr = b.nomr ';
  nama_tabel += 'LEFT JOIN tb_skrinning c ON a.kdberobat = c.kdberobat ';
  let nama_field = 'a.*,b.namapasien,b.jeniskelamin,b.tgllahir,b.alamat,';
  nama_field += 'b.nohp,c.tensi,c.beratbadan,c.tinggibadan';
  let kondisi = '';
  if (data.input_cari) {
    kondisi+= 'WHERE nomr LIKE "%' + data.input_cari + '%" ';
    kondisi+= 'OR statusberobat LIKE "%' + data.input_cari + '%" ';
    kondisi+= 'ORDER BY kdberobat ASC';
  }
  else{
    kondisi = 'ORDER BY kdberobat ASC';
  }
  try {
    sql = PublikFungsi.CariDataDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.CariDataDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
    console.log('Erorr Sistem : ' + error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error.",
              status_tampil: false,
              tokennyaa: "Hidden",
              error: err,
              jumlah_data: 0,
              data: results,
            })
          );
        } else {
          if (results.length > 0) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Datanya ada.",
                status_tampil: true,
                tokennyaa: "Hidden",
                error: null,
                jumlah_data: results.length,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Belum Ada datanya.",
                status_tampil: false,
                tokennyaa: "Hidden",
                error: null,
                jumlah_data: results.length,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_tampil: false,
          tokennyaa: data["token"],
          error: null,
          jumlah_data: 0,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_tampil: false,
        tokennyaa: data["token"],
        error: null,
        jumlah_data: 0,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/tambah_berobat", (req, res) => {
  console.log("Tambah Berobat");
  let data = {
    token: req.body.token,
    nomr : req.body.nomr,
    kodestaff : req.body.kodestaff,
    tglberobat : req.body.tglberobat,
    statusberobat : req.body.statusberobat,
    tensi : req.body.tensi,
    beratbadan : req.body.beratbadan,
    tinggibadan : req.body.tinggibadan,
    namapengguna : req.body.namapengguna,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  var nama_tabel = 'tb_berobat';
  var tgl_sekarang = PublikFungsi.WaktuSekarang("YYYY-MM-DD HH:mm:ss")
  
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      let sql_nomor_otomatis = PublikFungsi.NomorOtomatis('kdberobat',nama_tabel);
      conn.query(sql_nomor_otomatis, data, (err_otomatis, results_otomatis) => {        
        if (err_otomatis) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code Nomor Otomatis.",
              status_tambah: false,
              tokennyaa: "Hidden",
              error: err_otomatis,
              data: results_otomatis,
            })
          );
        } else {
          let kdberobat = ((results_otomatis[0].id === 0) || (results_otomatis[0].id === null)) ? 1 : results_otomatis[0].id;

          let nama_field = 'kdberobat,nomr,kodestaff,tglberobat,';
          nama_field += 'statusberobat,namapengguna';
          let value_field = '' + kdberobat + ',';
          value_field += '"' + data.nomr + '",';
          value_field += '"' + data.kodestaff + '",';
          value_field += '"' + tgl_sekarang + '",';
          value_field += '"' + data.statusberobat + '",';
          value_field += '"' + data.namapengguna + '"';

          try {
            sql = PublikFungsi.SimpanSingleDebug(
              nama_tabel,
              nama_field,
              value_field
            );
          } catch (error) {
            sql = PublikFungsi.SimpanSingleDebug(
              nama_tabel,
              nama_field,
              value_field
            );
            console.log('Erorr Sistem : ' + error);
          }
          conn.query(sql, data, (err, results) => {
            if (err) {
              res.send(
                JSON.stringify({
                  status: 200,
                  pesan: "Error Code Tambah Berobat.",
                  status_tambah: false,
                  tokennyaa: "Hidden",
                  error: err,
                  data: results,
                })
              );
              conn.end();
            } else {
              let affectedRows = results.affectedRows;
              if (affectedRows = 1) {
                let f_skrinning = 'kdberobat,tensi,beratbadan,tinggibadan,';
                f_skrinning += 'namapengguna';
                let v_skrinning = '"' + kdberobat + '",';
                v_skrinning += '"' + data.tensi + '",';
                v_skrinning += '"' + data.beratbadan + '",';
                v_skrinning += '"' + data.tinggibadan + '",';
                v_skrinning += '"' + data.namapengguna + '"';
                let sqlAddSkrinning = PublikFungsi.SimpanSingle(
                  'tb_skrinning',
                  f_skrinning,
                  v_skrinning
                );
                conn.query(sqlAddSkrinning, data, (errSkrinning, resultsSkrinning) => {
                  if (errSkrinning) {
                    res.send(
                      JSON.stringify({
                        status: 200,
                        pesan: "Error Code Tambah Skrinning.",
                        status_tambah: false,
                        tokennyaa: "Hidden",
                        error: errSkrinning,
                        data: resultsSkrinning,
                      })
                    );
                    conn.end();
                  }
                  else {
                    res.send(
                      JSON.stringify({
                        status: 200,
                        pesan: "Tambah Berobat dan Skrinning Sukses.",
                        status_tambah: true,
                        tokennyaa: "Hidden",
                        error: null,
                        data: results,
                      })
                    );
                    conn.end();
                  }
                });
              } else {
                res.send(
                  JSON.stringify({
                    status: 200,
                    pesan: "Tambah Berobat Error.",
                    status_tambah: false,
                    tokennyaa: "Hidden",
                    error: null,
                    data: results,
                  })
                );
              }
              conn.end();
            }
          });
        }
      });
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_tambah: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_tambah: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/ubah_berobat", (req, res) => {
  console.log("Ubah Berobat");
  let data = {
    token: req.body.token,
    kdberobat : req.body.kdberobat,
    nomr : req.body.nomr,
    kodestaff : req.body.kodestaff,
    tglberobat : req.body.tglberobat,
    statusberobat : req.body.statusberobat,
    namapengguna : req.body.namapengguna,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_berobat';

  let nama_field = 'nomr = "' + data.nomr + '",';
  nama_field += 'nomr = "' + data.nomr + '",';
  nama_field += 'kodestaff = "' + data.kodestaff + '",';
  nama_field += 'statusberobat = "' + data.statusberobat + '",';
  nama_field += 'namapengguna = "' + data.namapengguna + '"';

  let kondisi = 'kdberobat = "' + data.kdberobat + '"';

  try {
    sql = PublikFungsi.UbahDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.UbahDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
    console.log(error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code Berobat Staff.",
              status_ubah: false,
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          let affectedRows = results.affectedRows;
          if (affectedRows = 1) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Ubah Berobat Sukses.",
                status_ubah: true,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Ubah Berobat Error.",
                status_ubah: false,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_ubah: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_ubah: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/hapus_berobat", (req, res) => {
  console.log("Hapus Berobat");
  let data = {
    token: req.body.token,
    kdberobat : req.body.kdberobat,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_berobat';
  let kondisi = 'kdberobat = "' + data.kdberobat + '"';

  try {
    sql = PublikFungsi.HapusDebug(
      nama_tabel,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.HapusDebug(
      nama_tabel,
      kondisi
    );
    console.log(error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code. Hapus Berobat.",
              status_hapus: false,
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          let affectedRows = results.affectedRows;
          if (affectedRows = 1) {
            let sqlHapusKrinning = PublikFungsi.Hapus(
              'tb_skrinning',
              'kdberobat = "' + data.kdberobat + '"'
            );
            conn.query(sqlHapusKrinning, data, (errSkrinning, resultsSkrinning) => {
              if (errSkrinning) {
                res.send(
                  JSON.stringify({
                    status: 200,
                    pesan: "Error Code. Hapus Skrinning.",
                    status_hapus: false,
                    tokennyaa: "Hidden",
                    error: errSkrinning,
                    data: resultsSkrinning,
                  })
                );
                conn.end();
              }
              else{
                let sqlHapusDiagnosa = PublikFungsi.Hapus(
                  'tb_diagnosa',
                  'kdberobat = "' + data.kdberobat + '"'
                );
                conn.query(sqlHapusDiagnosa, data, (errDiagnosa, resultsDiagnosa) => {
                  if (errDiagnosa){
                    res.send(
                      JSON.stringify({
                        status: 200,
                        pesan: "Error Code. Hapus Diagnosa.",
                        status_hapus: false,
                        tokennyaa: "Hidden",
                        error: errDiagnosa,
                        data: resultsDiagnosa,
                      })
                    );
                    conn.end();
                  }
                  else{
                    res.send(
                      JSON.stringify({
                        status: 200,
                        pesan: "Hapus Berobat,Skrinning,Diagnosa Sukses.",
                        status_hapus: true,
                        tokennyaa: "Hidden",
                        error: null,
                        data: results,
                      })
                    );
                    conn.end();
                  }
                });
              }
            });
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Hapus Berobat Error.",
                status_hapus: false,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
            conn.end();
          }
        }
      });
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_hapus: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_hapus: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

//Pengguna
app.post("/api/login_pengguna", (req, res) => {
  console.log("Login Pengguna");
  let data = {
    token: req.body.token,
    namapengguna: req.body.namapengguna,
    sandipengguna: req.body.sandipengguna,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_pengguna';
  let nama_field = '*';
  let kondisi = '';
  kondisi+= 'WHERE namapengguna = "' + data.namapengguna + '" ';
  kondisi+= 'AND sandipengguna = "' + data.sandipengguna + '" ';
  kondisi+= 'AND status_akun = "Aktif"';
  try {
    sql = PublikFungsi.CariDataDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.CariDataDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
    console.log('Erorr Sistem : ' + error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code. Login Pengguna",
              status_tampil: false,
              tokennyaa: "Hidden",
              error: err,
              jumlah_data: 0,
              data: results,
            })
          );
          conn.end();
        } else {
          if (results.length > 0) {
            let tgl_sekarang = PublikFungsi.WaktuSekarang("YYYY-MM-DD HH:mm:ss");
            let sql_update = '';
            nama_field = 'terakhir_login = "' + tgl_sekarang + '"';
            kondisi = 'namapengguna = "' + data.namapengguna + '" ';
            sql_update = PublikFungsi.UbahDebug(
              nama_tabel,
              nama_field,
              kondisi
            );
            conn.query(sql_update, data, (err_update, results_update) => {
              if (err_update) {
                res.send(
                  JSON.stringify({
                    status: 200,
                    pesan: "Error Code. Update Last Login",
                    status_tampil: false,
                    tokennyaa: "Hidden",
                    error: err_update,
                    jumlah_data: 0,
                    data: results_update,
                  })
                );
                conn.end();
              } else {
                res.send(
                  JSON.stringify({
                    status: 200,
                    pesan: "Login Berhasil.",
                    status_tampil: true,
                    tokennyaa: "Hidden",
                    error: null,
                    jumlah_data: results.length,
                    data: results,
                  })
                );
                conn.end();
              }
            });
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Login Gagal.",
                status_tampil: false,
                tokennyaa: "Hidden",
                error: null,
                jumlah_data: results.length,
                data: results,
              })
            );
          }
        }
      });
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_tampil: false,
          tokennyaa: data["token"],
          error: null,
          jumlah_data: 0,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_tampil: false,
        tokennyaa: data["token"],
        error: null,
        jumlah_data: 0,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/tampil_pengguna", (req, res) => {
  console.log("Tampil Pengguna");
  let data = {
    token: req.body.token,
    input_cari: req.body.input_cari,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_pengguna';
  let nama_field = '*';
  let kondisi = '';
  if (data.input_cari) {
    kondisi+= 'WHERE namapengguna LIKE "%' + data.input_cari + '%" ';
    kondisi+= 'OR level_akses LIKE "%' + data.input_cari + '%" ';
    kondisi+= 'ORDER BY namapengguna ASC';
  }
  else{
    kondisi = 'ORDER BY namapengguna ASC';
  }
  try {
    sql = PublikFungsi.CariDataDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.CariDataDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
    console.log('Erorr Sistem : ' + error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error.",
              status_tampil: false,
              tokennyaa: "Hidden",
              error: err,
              jumlah_data: 0,
              data: results,
            })
          );
        } else {
          if (results.length > 0) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Datanya ada.",
                status_tampil: true,
                tokennyaa: "Hidden",
                error: null,
                jumlah_data: results.length,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Belum Ada datanya.",
                status_tampil: false,
                tokennyaa: "Hidden",
                error: null,
                jumlah_data: results.length,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_tampil: false,
          tokennyaa: data["token"],
          error: null,
          jumlah_data: 0,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_tampil: false,
        tokennyaa: data["token"],
        error: null,
        jumlah_data: 0,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/tambah_pengguna", (req, res) => {
  console.log("Tambah Pengguna");
  let data = {
    token: req.body.token,
    namapengguna : req.body.namapengguna,
    sandipengguna : req.body.sandipengguna,
    level_akses : req.body.level_akses,
    status_akun : req.body.status_akun,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let tgl_sekarang = PublikFungsi.WaktuSekarang("YYYY-MM-DD HH:mm:ss");
  let sql;
  let nama_tabel = 'tb_pengguna';
  let nama_field = 'namapengguna,sandipengguna,level_akses,status_akun,tgl_create';
  let value_field = '"' + data.namapengguna + '",';
  value_field += '"' + data.sandipengguna + '",';
  value_field += '"' + data.level_akses + '",';
  value_field += '"' + data.status_akun + '",';
  value_field += '"' + tgl_sekarang + '"';

  try {
    sql = PublikFungsi.SimpanSingleDebug(
      nama_tabel,
      nama_field,
      value_field
    );
  } catch (error) {
    sql = PublikFungsi.SimpanSingleDebug(
      nama_tabel,
      nama_field,
      value_field
    );
    console.log('Erorr Sistem : ' + error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code Tambah Pengguna.",
              status_tambah: false,
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          let affectedRows = results.affectedRows;
          if (affectedRows = 1) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Tambah Pengguna Sukses.",
                status_tambah: true,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Tambah Pengguna Error.",
                status_tambah: false,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_tambah: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_tambah: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/ubah_pengguna", (req, res) => {
  console.log("Ubah Pengguna");
  let data = {
    token: req.body.token,
    namapengguna : req.body.namapengguna,
    sandipengguna : req.body.sandipengguna,
    level_akses : req.body.level_akses,
    status_akun : req.body.status_akun,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let tgl_sekarang = PublikFungsi.WaktuSekarang("YYYY-MM-DD HH:mm:ss");
  let sql;
  let nama_tabel = 'tb_pengguna';

  let nama_field = 'sandipengguna = "' + data.sandipengguna + '",';
  nama_field += 'level_akses = "' + data.level_akses + '",';
  nama_field += 'status_akun = "' + data.status_akun + '",';
  nama_field += 'tgl_ubah = "' + tgl_sekarang + '"';

  let kondisi = 'namapengguna = "' + data.namapengguna + '"';

  try {
    sql = PublikFungsi.UbahDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.UbahDebug(
      nama_tabel,
      nama_field,
      kondisi
    );
    console.log(error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code Ubah Pengguna.",
              status_ubah: false,
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          let affectedRows = results.affectedRows;
          if (affectedRows = 1) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Ubah Pengguna Sukses.",
                status_ubah: true,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Ubah Pengguna Error.",
                status_ubah: false,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_ubah: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_ubah: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

app.post("/api/hapus_pengguna", (req, res) => {
  console.log("Hapus Pengguna");
  let data = {
    token: req.body.token,
    namapengguna : req.body.namapengguna,
    jam_request: PublikFungsi.WaktuSekarang("DD-MM-YYYY HH:mm:ss") + " Wib.",
  };
  let sql;
  let nama_tabel = 'tb_pengguna';
  let kondisi = 'namapengguna = "' + data.namapengguna + '"';

  try {
    sql = PublikFungsi.HapusDebug(
      nama_tabel,
      kondisi
    );
  } catch (error) {
    sql = PublikFungsi.HapusDebug(
      nama_tabel,
      kondisi
    );
    console.log(error);
  }
  res.setHeader("Content-Type", "application/json");
  if (data["token"]) {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              pesan: "Error Code. Hapus Pengguna.",
              status_hapus: false,
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          let affectedRows = results.affectedRows;
          if (affectedRows = 1) {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Hapus Pengguna Sukses.",
                status_hapus: true,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                pesan: "Hapus Pengguna Error.",
                status_hapus: false,
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          pesan: "Token Tidak Sesuai !",
          status_hapus: false,
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        pesan: "Inputan Kurang !",
        status_hapus: false,
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

//Sample Upload Gambar belum terpakai
app.put("/api/tambah_data_gbr", (req, res) => {
  let data = {
    token: req.body.token,
    nama_tabel: req.body.nama_tabel,
    nama_field: req.body.nama_field,
    value_field: req.body.value_field,
    gbr_base64: req.body.gbr_base64,
    nama_foto: req.body.nama_foto,
    alamat_foto: req.body.alamat_foto,
  };
  let sql, nama_fotonya;
  let nama_tabel = data["nama_tabel"];
  try {
    if (nama_tabel) {
      sql = PublikFungsi.SimpanSingle(
        base64.decode(data["nama_tabel"]),
        data["nama_field"],
        data["value_field"]
      );
    } else {
      sql = PublikFungsi.SimpanSingle(
        "",
        data["nama_field"],
        data["value_field"]
      );
    }
  } catch (error) {
    sql = PublikFungsi.SimpanSingle(
      "",
      data["nama_field"],
      data["value_field"]
    );
    console.log(error);
  }
  nama_fotonya = data["nama_foto"];
  res.setHeader("Content-Type", "application/json");
  if (!data || typeof data != "undefined") {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          console.log("Error : " + err);
          res.send(
            JSON.stringify({
              status: 200,
              status_simpan: false,
              pesan: "Datanya Sudah Ada.",
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          if (data["gbr_base64"] && data["nama_foto"] && data["alamat_foto"]) {
            const buffer = Buffer.from(data["gbr_base64"], "base64");
            Jimp.read(buffer, (err, res_jimp) => {
              if (err) {
                console.log("Error : " + err);
                res.send(
                  JSON.stringify({
                    status: 200,
                    status_simpan: false,
                    pesan: "Data berhasil diinput tetapi error upload gambar !",
                    tokennyaa: "Hidden",
                    error: err,
                    data: results,
                  })
                );
              } else {
                res_jimp.quality(100).write(data["alamat_foto"] + nama_fotonya);
                res.send(
                  JSON.stringify({
                    status: 200,
                    status_simpan: true,
                    pesan: "Sukses Input Data.",
                    tokennyaa: "Hidden",
                    error: null,
                    data: results,
                  })
                );
              }
            });
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                status_simpan: true,
                pesan: "Sukses Input Data Tanpa Gambar.",
                tokennyaa: "Hidden",
                error: null,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          status_simpan: false,
          pesan: "Token Tidak Sesuai !",
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        status_simpan: false,
        pesan: "Token Kosong !",
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

//Diagnosa. Buat 4 fungsi untuk tabel diagnosa : Tampil dan CRUD

app.put("/api/tambah_data_gbr_2", (req, res) => {
  let data = {
    token: req.body.token,
    nama_tabel: req.body.nama_tabel,
    nama_field: req.body.nama_field,
    value_field: req.body.value_field,
    gbr_base64: req.body.gbr_base64,
    gbr_base64_2: req.body.gbr_base64_2,
    nama_foto: req.body.nama_foto,
    nama_foto_2: req.body.nama_foto_2,
    alamat_foto: req.body.alamat_foto,
    alamat_foto_2: req.body.alamat_foto_2,
  };
  let sql, nama_fotonya, nama_fotonya_2, errornya_1, errorNya_2;
  let nama_tabel = data["nama_tabel"];
  try {
    if (nama_tabel) {
      sql = PublikFungsi.SimpanSingle(
        base64.decode(data["nama_tabel"]),
        data["nama_field"],
        data["value_field"]
      );
    } else {
      sql = PublikFungsi.SimpanSingle(
        "",
        data["nama_field"],
        data["value_field"]
      );
    }
  } catch (error) {
    sql = PublikFungsi.SimpanSingle(
      "",
      data["nama_field"],
      data["value_field"]
    );
    console.log(error);
  }
  nama_fotonya = data["nama_foto"];
  nama_fotonya_2 = data["nama_foto_2"];
  res.setHeader("Content-Type", "application/json");
  if (!data || typeof data != "undefined") {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          console.log("Error : " + err);
          res.send(
            JSON.stringify({
              status: 200,
              status_simpan: false,
              pesan: "Datanya Sudah Ada.",
              tokennyaa: "Hidden",
              error: err,
              data: results,
            })
          );
        } else {
          if (
            data["gbr_base64"] &&
            data["gbr_base64_2"] &&
            data["nama_foto"] &&
            data["nama_foto_2"] &&
            data["alamat_foto"] &&
            data["alamat_foto_2"]
          ) {
            const buffer = Buffer.from(data["gbr_base64"], "base64");
            const buffer_2 = Buffer.from(data["gbr_base64_2"], "base64");
            Jimp.read(buffer, (err, res_jimp) => {
              if (err) {
                console.log("Error Buffer 1 : " + err);
                errornya_1 = err;
              } else {
                res_jimp.quality(100).write(data["alamat_foto"] + nama_fotonya);
                console.log("Sukses Buffer 1");
                errornya_1 = null;
              }
            });

            Jimp.read(buffer_2, (err_2, res_jimp_2) => {
              if (err) {
                console.log("Error Buffer 1 : " + err_2);
                errorNya_2 = err_2;
              } else {
                res_jimp_2
                  .quality(100)
                  .write(data["alamat_foto_2"] + nama_fotonya_2);
                console.log("Sukses Buffer 2");
                errorNya_2 = null;
              }
            });

            res.send(
              JSON.stringify({
                status: 200,
                status_simpan: true,
                pesan: "Sukses Input Data Bergambar.",
                tokennyaa: "Hidden",
                error_gbr_1: errornya_1,
                error_gbr_2: errorNya_2,
                data: results,
              })
            );
          } else {
            res.send(
              JSON.stringify({
                status: 200,
                status_simpan: true,
                pesan: "Sukses Input Data Tanpa Gambar.",
                tokennyaa: "Hidden",
                error: null,
                jumlah_data: results.length,
                data: results,
              })
            );
          }
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          status_simpan: false,
          pesan: "Token Tidak Sesuai !",
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        status_simpan: false,
        pesan: "Token Kosong !",
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

//Sample untuk kosongkan data didalam databel
app.post("/api/kosongkan_data", (req, res) => {
  let data = {
    token: req.body.token,
    nama_tabel: req.body.nama_tabel,
  };
  let sql;
  let nama_tabel = data["nama_tabel"];
  try {
    if (nama_tabel) {
      sql = PublikFungsi.KosongkanDataDebug(base64.decode(data["nama_tabel"]));
    } else {
      sql = PublikFungsi.KosongkanDataDebug("");
    }
  } catch (error) {
    sql = PublikFungsi.KosongkanDataDebug("");
    console.log(error);
  }
  res.setHeader("Content-Type", "application/json");
  if (!data || typeof data != "undefined") {
    if (Token.LoginToken(data["token"])) {
      hendelKoneksi();
      conn.query(sql, data, (err, results) => {
        if (err) {
          res.send(
            JSON.stringify({
              status: 200,
              status_kosongkan: false,
              pesan: "Error Kosongkan Data : " + err.message,
              tokennyaa: "Hidden",
              error: err,
              jumlah_data: 0,
              data: results,
            })
          );
        } else {
          res.send(
            JSON.stringify({
              status: 200,
              status_kosongkan: true,
              pesan: "Sukses Kosongkan Data.",
              tokennyaa: "Hidden",
              error: null,
              jumlah_data: 0,
              data: results,
            })
          );
        }
      });
      conn.end();
      console.log("Putuskan MySQL/MariaDB...");
    } else {
      res.send(
        JSON.stringify({
          status: 200,
          status_kosongkan: false,
          pesan: "Token Tidak Sesuai !",
          tokennyaa: data["token"],
          error: null,
          data: [],
        })
      );
    }
  } else {
    res.send(
      JSON.stringify({
        status: 200,
        status_kosongkan: false,
        pesan: "Token Kosong !",
        tokennyaa: data["token"],
        error: null,
        data: [],
      })
    );
  }
  console.log(data);
});

//api menampilkan gambar belum terpakai
app.get("/gambar", (req, res) => {
  let data = {
    path_req: req.query.path_req,
    nama_foto_req: req.query.nama_foto_req,
  };
  console.log(data);
  let alamat_path1;
  if (data["path_req"] && data["nama_foto_req"]) {
    alamat_path1 = path.join(
      __dirname + "/" + data["path_req"] + data["nama_foto_req"]
    );
  } else {
    alamat_path1 = path.join(__dirname + "/gambar/");
  }
  console.log("path : " + alamat_path1);
  res.sendFile(alamat_path1);
});

//Server listening
var host = process.env.HOT || "localhost";
var port = process.env.PORT || 81;
var server = app.listen(port, () => {
  console.log("RestApi Menggunakan Express JS. Port Server : " + port + "..." + "\n");
  console.log("Listen di http://" + host + ":" + port);
  console.log("Starting di tanggal dan waktu : " + PublikFungsi.WaktuSekarang("DD MMMM YYYY HH:mm:ss"));
});