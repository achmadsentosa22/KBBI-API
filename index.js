// setup var
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const request = require('request');
const cheerio = require('cheerio');
const HTMLParser = require('node-html-parser');
// run app index
app.get('/', function (req, res) {
    res.json({
        message: "Selamat datang di web KBBI API",
        github: "https://github.com/achmadsentosa22/",
        penggunaan: "Silakan Tambahkan /kbbi?search=kata-yang-dicari pada url untuk mencari kata"
    });
});
// cari
app.get('/kbbi', function (req, res) {
    // cek query
    const kata_cari = req.query.search;
    // jika search ada dan tidak
    if (kata_cari) {
        // jika ada
        request({
            url: `https://kbbi.web.id/${kata_cari}`,
            json: true
        }, async (err, response, body) => {
            // jika tidak error dan status 200
            if (!err && response.statusCode == 200) {
                // var main
                var Result_Data = {
                    search: kata_cari,
                    status_cari: 0,
                    keterangan_cari: 0,
                    github: "https://github.com/achmadsentosa22/",
                    result: null
                };
                // set ke data kata
                var Data_Kata = {
                    word: 0,
                    suku: 0,
                    jenis: 0,
                    deskripsi: 0,
                    detail: []
                };
                // jika tidak error
                const $ = await cheerio.load(body);
                const jsdata = $('textarea#jsdata').text();
                // cek jika js data ada
                if (jsdata) {
                    // dapat data
                    const parsejsdata = JSON.parse(jsdata);
                    // filter 
                    var datafilter = parsejsdata.filter(c => c.x == 1);
                    // filter sort
                    const fil_sort = (x) => { return parseInt(x.w.match(/<sup>(.*?)<\/sup>/g).toString().replace(/<sup>|<\/sup>/g, "")) }
                    // sort jika ada sup
                    datafilter.sort((a, b) => fil_sort(a) - fil_sort(b));
                    // tata datanya
                    datafilter.forEach((item, index) => {
                        // memisah data untuk mengambil suku
                        const pisahdata = item.d.replace(/&#183;/ig, '.').split("<br/>").filter(z => z.length);
                        // cek dan ambil data split yang pertama
                        pisahdata.forEach((item_d, index_d) => {
                            // data detail set
                            var per_data = {}
                            // suku dan sesuaikan pengambilan datanya
                            const datasuku = item_d.match(/<b>(.*?)<\/b>/g);
                            if (datasuku) {
                                if (datasuku[0]) {
                                    const suku = datasuku[0].replace(/<sup>(.*?)<\/sup>/g, "").replace(/<b>|<\/b>/g, "");
                                    if (!index && !index_d) {
                                        Data_Kata.word = suku.replace(/\./ig, '');
                                        Data_Kata.suku = suku;
                                        Data_Kata.deskripsi = HTMLParser.parse(item_d.replace(datasuku[0], "").replace(/<em>(n|v|a)<\/em>/g, "").trim()).text;
                                    }
                                    if (datasuku[0].indexOf("--") != -1) {
                                        per_data.sub_kata = {
                                            judul: suku.replace(/-/ig, "").trim(),
                                            keterangan: HTMLParser.parse(item_d.replace(datasuku[0], "").replace(/<em>(n|v|a)<\/em>/g, "").trim()).text
                                        }
                                    } else {
                                        per_data.sub_kata = {
                                            judul: suku.replace(/\./ig, "").trim(),
                                            keterangan: HTMLParser.parse(item_d.replace(datasuku[0], "").replace(/<em>(n|v|a)<\/em>/g, "").trim()).text
                                        }
                                    }
                                }
                            }
                            // jenis kata
                            const datajenis = item_d.match(/<em>(n|v|a)<\/em>/g);
                            if (datajenis) {
                                const jeniskata = datajenis.toString().replace(/<em>|<\/em>/ig, "");
                                const statusjenis = jeniskata == 'n' ? ["Nomina", "Kata Benda"] : jeniskata == 'v' ? ["Verba", "Kata Kerja"] : jeniskata == 'a' ? ["adjektiva", "Kata Sifat"] : 0;
                                if (statusjenis) {
                                    per_data.jenis = statusjenis;
                                    if (!index && !index_d) {
                                        Data_Kata.jenis = statusjenis;
                                    }
                                }
                            }
                            // push data
                            Data_Kata.detail.push(per_data);
                        });
                    });
                    // jadikan satu ke result
                    Result_Data.result = Data_Kata;
                    Result_Data.status_cari = true;
                    Result_Data.keterangan_cari = "Kata Berhasil di Temukan";
                    // final
                    res.json(Result_Data);
                } else {
                    Result_Data.status_cari = false;
                    Result_Data.keterangan_cari = "Kata Tidak di Temukan";
                    // final
                    res.json(Result_Data);
                }
            } else {
                // jika error
                res.json({
                    status: res.statusCode,
                    message: err
                });
            }
        });
    } else {
        // jika tidak ada
        res.json({
            message: "Silakan masukan Kata yang di cari. Tambahkan ?search=kata-yang-dicari pada url"
        });
    }
});
// run port location
app.listen(port, function () {
    console.log('App listening on port ' + port)
});