-- phpMyAdmin SQL Dump
-- version 4.9.10
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Waktu pembuatan: 11 Jun 2023 pada 16.36
-- Versi server: 10.1.22-MariaDB
-- Versi PHP: 7.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `daftar_berobat`
--
CREATE DATABASE IF NOT EXISTS `daftar_berobat` DEFAULT CHARACTER SET latin1 COLLATE latin1_general_ci;
USE `daftar_berobat`;

-- --------------------------------------------------------

--
-- Struktur dari tabel `tb_berobat`
--

DROP TABLE IF EXISTS `tb_berobat`;
CREATE TABLE `tb_berobat` (
  `kdberobat` int(11) NOT NULL,
  `nomr` varchar(15) COLLATE latin1_general_ci DEFAULT NULL,
  `kodestaff` varchar(20) COLLATE latin1_general_ci DEFAULT NULL,
  `tglberobat` datetime DEFAULT NULL,
  `statusberobat` enum('Kontrol','Selesai') COLLATE latin1_general_ci DEFAULT NULL,
  `namapengguna` varchar(50) COLLATE latin1_general_ci DEFAULT NULL COMMENT 'Trace Siapa yang input'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Dumping data untuk tabel `tb_berobat`
--

INSERT INTO `tb_berobat` (`kdberobat`, `nomr`, `kodestaff`, `tglberobat`, `statusberobat`, `namapengguna`) VALUES
(1, '1030', '102', '2023-06-11 23:20:03', 'Kontrol', 'JeanRiko');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tb_diagnosa`
--

DROP TABLE IF EXISTS `tb_diagnosa`;
CREATE TABLE `tb_diagnosa` (
  `kddiagnosa` int(11) NOT NULL,
  `kdberobat` int(11) NOT NULL DEFAULT '0',
  `diagnosa` varchar(300) COLLATE latin1_general_ci DEFAULT NULL,
  `namaobat` varchar(150) COLLATE latin1_general_ci NOT NULL,
  `jumlahobat` tinyint(3) UNSIGNED NOT NULL,
  `makanobat` varchar(100) COLLATE latin1_general_ci NOT NULL,
  `namapengguna` varchar(50) COLLATE latin1_general_ci DEFAULT NULL COMMENT 'Trace Siapa yang input'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `tb_pasien`
--

DROP TABLE IF EXISTS `tb_pasien`;
CREATE TABLE `tb_pasien` (
  `nomr` varchar(15) COLLATE latin1_general_ci NOT NULL,
  `namapasien` varchar(50) COLLATE latin1_general_ci DEFAULT NULL,
  `jeniskelamin` enum('Laki-Laki','Perempuan') COLLATE latin1_general_ci DEFAULT NULL,
  `tgllahir` date DEFAULT NULL,
  `alamat` varchar(300) COLLATE latin1_general_ci DEFAULT NULL,
  `nohp` varchar(13) COLLATE latin1_general_ci DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Dumping data untuk tabel `tb_pasien`
--

INSERT INTO `tb_pasien` (`nomr`, `namapasien`, `jeniskelamin`, `tgllahir`, `alamat`, `nohp`) VALUES
('1033', 'AAAAA', 'Laki-Laki', '1995-08-08', 'Jalan', '787897897'),
('1030', 'Saya', 'Laki-Laki', '2000-06-09', 'Jalan', '12345'),
('1031', 'dfsfsf', 'Perempuan', '2023-06-09', 'dsfsdfdsf', '3e3eeer');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tb_pengguna`
--

DROP TABLE IF EXISTS `tb_pengguna`;
CREATE TABLE `tb_pengguna` (
  `namapengguna` varchar(50) COLLATE latin1_general_ci NOT NULL,
  `sandipengguna` varchar(150) COLLATE latin1_general_ci DEFAULT NULL,
  `level_akses` enum('Admin','Perawat','Dokter','Apotek') COLLATE latin1_general_ci DEFAULT NULL,
  `status_akun` enum('Aktif','Tidak Aktif','Suspend') COLLATE latin1_general_ci DEFAULT NULL,
  `tgl_create` datetime DEFAULT NULL,
  `tgl_ubah` datetime DEFAULT NULL,
  `terakhir_login` datetime DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Dumping data untuk tabel `tb_pengguna`
--

INSERT INTO `tb_pengguna` (`namapengguna`, `sandipengguna`, `level_akses`, `status_akun`, `tgl_create`, `tgl_ubah`, `terakhir_login`) VALUES
('JeanRiko', 'riko', 'Admin', 'Aktif', '2023-06-07 16:07:30', '2023-06-07 16:16:49', '2023-06-11 19:37:02'),
('aaaaaaaaa', 'aaaaaaa', 'Perawat', 'Suspend', '2023-06-09 08:16:05', NULL, NULL),
('juki', 'juki', 'Dokter', 'Aktif', '2023-06-11 19:43:13', NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `tb_skrinning`
--

DROP TABLE IF EXISTS `tb_skrinning`;
CREATE TABLE `tb_skrinning` (
  `kdskrinning` int(11) NOT NULL,
  `kdberobat` int(11) NOT NULL,
  `tensi` varchar(150) COLLATE latin1_general_ci NOT NULL,
  `beratbadan` tinyint(3) UNSIGNED NOT NULL DEFAULT '0',
  `tinggibadan` tinyint(3) UNSIGNED NOT NULL DEFAULT '0',
  `namapengguna` varchar(50) COLLATE latin1_general_ci DEFAULT NULL COMMENT 'Trace Siapa yang input'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Dumping data untuk tabel `tb_skrinning`
--

INSERT INTO `tb_skrinning` (`kdskrinning`, `kdberobat`, `tensi`, `beratbadan`, `tinggibadan`, `namapengguna`) VALUES
(2, 1, '100 rpm', 80, 160, 'JeanRiko');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tb_staff`
--

DROP TABLE IF EXISTS `tb_staff`;
CREATE TABLE `tb_staff` (
  `kodestaff` varchar(20) COLLATE latin1_general_ci NOT NULL,
  `namastaff` varchar(50) COLLATE latin1_general_ci DEFAULT NULL,
  `jabatanstaff` enum('Apotek','Dokter','Perawat') COLLATE latin1_general_ci DEFAULT NULL,
  `namapengguna` varchar(50) COLLATE latin1_general_ci DEFAULT NULL COMMENT '1 to 1ke tb_pengguna',
  `tgllahirstaff` date DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Dumping data untuk tabel `tb_staff`
--

INSERT INTO `tb_staff` (`kodestaff`, `namastaff`, `jabatanstaff`, `namapengguna`, `tgllahirstaff`) VALUES
('101', 'AAAAA', 'Perawat', 'JeanRiko', '2000-01-01'),
('102', 'dr. Juki', 'Dokter', 'juki', '1997-06-12');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `tb_berobat`
--
ALTER TABLE `tb_berobat`
  ADD PRIMARY KEY (`kdberobat`);

--
-- Indeks untuk tabel `tb_diagnosa`
--
ALTER TABLE `tb_diagnosa`
  ADD PRIMARY KEY (`kddiagnosa`);

--
-- Indeks untuk tabel `tb_pasien`
--
ALTER TABLE `tb_pasien`
  ADD PRIMARY KEY (`nomr`);

--
-- Indeks untuk tabel `tb_pengguna`
--
ALTER TABLE `tb_pengguna`
  ADD PRIMARY KEY (`namapengguna`);

--
-- Indeks untuk tabel `tb_skrinning`
--
ALTER TABLE `tb_skrinning`
  ADD PRIMARY KEY (`kdskrinning`);

--
-- Indeks untuk tabel `tb_staff`
--
ALTER TABLE `tb_staff`
  ADD PRIMARY KEY (`kodestaff`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `tb_diagnosa`
--
ALTER TABLE `tb_diagnosa`
  MODIFY `kddiagnosa` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `tb_skrinning`
--
ALTER TABLE `tb_skrinning`
  MODIFY `kdskrinning` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
