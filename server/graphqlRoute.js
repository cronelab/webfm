import graphqlHTTP from 'express-graphql';
import graphql from 'graphql';
import fs from 'fs-extra'

import path from 'path'





export default express => {
    const router = express.Router();

    let schema = graphql.buildSchema(`
        type Query {
            subjects: [String]
            records(subj: String): [String]
            record(subj: String, rec: String): Record
            info(subj: String): Info
            configurations(task: String): [Float]
        },
        type Info {
            channels: [Channel]
            notes: String
            image: String
        },
        type Channel{
            name: String
            x: Float
            y: Float
        },
        type Record {
            times: [Float]
            data: Data
        },
        type Data {
            channel: [[Float]]
        },

        `);



    router.use('/graphql', graphqlHTTP({
        schema: schema,
        rootValue: {
            subjects: () => fs.readdirSync('./data', (err, subjs) => subjs),
            records: (args) => fs.readdirSync(`./data/${args.subj}`, (err, files) => files),
            configurations: async (args) => {
                let configFile = await fs.readJSON(`./server/config.json`)
                return configFile.times[args.task];
            },
            info: async (args) => {
                let chVals = await fs.readJSON(`./data/${args.subj}/info/channels.json`)
                let chNames = Object.keys(chVals)
                let chPositions = Object.values(chVals)

                let channels = chNames.map((y, i) => {
                    return {
                        name: y,
                        x: chPositions[i].x,
                        y: chPositions[i].y
                    }
                })
                let notes = fs.readFileSync(`./data/${args.subj}/info/notes.txt`, 'utf8', (err, data) => data);
                let rawImage = fs.readFileSync(`./data/${args.subj}/info/reconstruction.jpg`)
                let image = `data:image/.jpg;base64,${new Buffer(rawImage, 'binary').toString('base64')}`;
                return {
                    channels,
                    notes,
                    image
                }
            },
            record: async (args) =>{
                let file = await fs.readJSON(`./data/${args.subj}/${args.rec}.json`)
                let times = file.contents.times
                let dataKeys = Object.keys(file.contents)
                let dataMean;
                if(dataKeys.includes('stats')){
                    dataMean = file.contents.stats.estimators.mean;
                    let baselineMean = file.contents.stats.baseline.mean;
                    let baselineVar = file.contents.stats.baseline.variance;
                    Object.keys(dataMean).map((key, i) => {
                        dataMean[key] = dataMean[key].map(x => {
                            return (x-baselineMean[key])/Math.sqrt(baselineVar[key])
                        })
                    })
                    fs.writeFile(`./data/PY19N006/data/values.json`, JSON.stringify(dataMean), (err) => console.log(err))

                }
                let values = file.contents.values
                if(values != undefined) {
                    data = values
                }
                else if(dataMean != undefined){
                    data = dataMean;
                }
                return {
                    times,
                    data: {
                        channel: Object.values(data)
                    }
                }
            }
        },
        graphiql: true,
    }));

    return router;
}