let mongoose = require('mongoose');

let recordSchema = mongoose.Schema({
    identifier: String,
    geometry: Object,
    brainImage: Buffer,
    notes: String,
    date_created:{
        type: Date,
        default: Date.now
    },
    task:{
        // taskType: {
        //     stats:{
        //         baseline:{
        //             mean: Object,
        //             variance: Object,
        //             count: Number
        //         },
        //         estimators:{
        //             mean: Object,
        //             variance: Object,
        //             count: Number
        //         }
        //     },
        //     record: Array,
        //     date_recorded:{
        //         type: Date,
        //         default: Date.now
        //     },
        //     datFile: String,
        //     times:{
        //         baseline: Object,
        //         trial: Object
        //     }
        // }
    }
})

module.exports = mongoose.model("records", recordSchema);




// mongoose.connection.db.listCollections().toArray(function (err, names) {
  //     // console.log(names); // [{ name: 'dbname.myCollection' }]
  //     module.exports.Collection = names;


  //  mongoose.connection.close();


  // newRecord.save(err => {
  //   if (err) console.log('Could not create entry');
  // });
  
  // })


  

  //   app.get('/api/mongoTest/', (req,res) =>{
  //     Record.find({ identifier: "PY18N004" }, (a,b)=>{
  //       console.log(b);  
  //       res.send(b[0].montage[0])
  //     })})
















  

  // let newRecord= new Record({ 
  //   identifier: 'PY17N009',
  //   brainImage: fs.readFileSync('./data/brain.png'),
  //   geometry: {"RAF1":{"u":0.56031276,{"u":0.608803165,"v":0.45508982},"RFG128":{"u":0.613748764,"v":0.423952096}},
  //   notes: "First database entry everrrrrr",
  //   task:{
  //     taskType:{
  //       description:"SyllableReading",
  //       index:1,
  //       stats:{
  //         baseline:{
  //           mean: {"RAF1":13.378177792700857,"DC15":0.005922002035288394,"DC16":0.020644197212743833},
  //           variance:{"RAF1":139.4528971213908,"RAF2":98.00172236341749,"RAF3":80.83225768131699,"RAF4":87.94672463611911,"DC16":0.00014266483730365436},
  //           count:55
  //         },
  //         estimators:{
  //           mean:{"RAF1":[14.805637025833128,0.003344471799209714,0.010126000037416816,0.01209925524890423,0.01448130588978529]}] });
    //   record[0].save();
    //     // res.contentType('image/png');
    //     // res.end(record[0].brainImage,'binary')
    //   console.log(record[0].task.taskType)
    //   }))
    // });

// newRecord.save(err => {
//     if (err) console.log('Could not create entry');
//   });