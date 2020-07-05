const express = require("express")
const path= require("path")
const crypto = require("crypto")
const mongoose=require("mongoose")
const multer = require("multer")

const GridFsStorage = require("multer-gridfs-storage")
const Grid = require("gridfs-stream")
const methodOverride = require("method-override")
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())
app.use(methodOverride('_method'))
//MongoUri
const mongoUri = 'mongodb+srv://nandwalRitik:------@cluster0.efxv6.azure.mongodb.net/------?retryWrites=true&w=majority'
const conn = mongoose.createConnection(mongoUri)
let gfs;
conn.once('open',()=>{
    gfs = Grid(conn.db,mongoose.mongo);
    gfs.collection('uploads')
})

//Storage Engine
const storage = new GridFsStorage({
  url: mongoUri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });
//@route GET /
//@desc loads form

app.get('/',(req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        // Check if files 
        if(!files || files.length === 0){
            res.render('index',{files:false});
        }else{
            files.map(file =>{
                if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
                    file.isImage = true
                }else{
                    file.isImage = false
                }
            })
            res.render('index',{files:files});
        }
            
    })
})

//@route POST /upload
//@desc Uploads file to DB
app.post('/upload',upload.single('file'),(req,res)=>{
    // res.json({file:req.file});
    res.redirect('/');
})
// route GET /files
//desc display all files in JSON
app.get('/files',(req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        // Check if files 
        if(!files || files.length === 0){
            return res.status(404).json({
                err:"no file exist"
            })
        }
        return res.json(files)
            
    })
})

app.get('/files/:filename',(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file) => {
        if(!file || file.length === 0){
            return res.status(404).json({
                err:"no file exist"
            })
        }
        return res.json(file)
    })
})


app.get('/image/:filename',(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file) => {
        if(!file || file.length === 0){
            return res.status(404).json({
                err:"no file exist"
            })
        }
        if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
            const readStream = gfs.createReadStream(file.filename);
            readStream.pipe(res);
        }else{
            res.status(404).json({
                err:"Not an image"
            })
        }
    })
})

app.set('view engine','ejs')
app.get('/',(req,res)=>{
    res.render('index')
})

// @route DELETE /files/:id
// @desc Delete file
app.delete('/files/:id', (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
      if (err) {
        return res.status(404).json({ err: err });
      }
  
      res.redirect('/');
    });
  });
const port = process.env.PORT || 5000;

app.listen(port,()=>console.log(`Server started on port ${port}`))