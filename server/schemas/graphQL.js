const graphql = require('graphql');
const _ = require('lodash');
const { GraphQLFloat, GraphQLList, GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt } = graphql;
const Record = require('./mongo')


let subjects = [
    {
        id: "PY18N008",
        brainImage: "testingImage",
        geometry: {
            RAF1: {
                x: 2.2,
                y: 3.1
            },
            RAF2: {
                x: 8.7,
                y: 1.4
            }
        },
        tasks: ["SyllableReading", "WordRepetition"]
    },
    {
        id: "PY18N007",
        brainImage: Buffer('asdfasdfasdf'),
        geometry: {
            LMD1: {
                x: 4.6,
                y: 5.3
            },
            LMD2: {
                x: 1.9,
                y: 9.8
            },
            LMD3: {
                x: 4.4,
                y: 4.2
            }
        },
        tasks: ["SyllableReading", "Match3"]
    }
]

const GeometryType = new GraphQLObjectType({
    name: 'Geometry',
    fields: {
        channels: {
            type: GraphQLList(GraphQLString),
            resolve(parents, args) {
                return Object.keys(parents)
            }
        },
        u: {
            type: GraphQLList(GraphQLFloat),
            resolve(parents, args) {
                let allCoord = Object.values(parents)
                let x = []
                allCoord.map(ch => {
                    x.push(Object.values(ch)[0])
                })
                return x
            }
        },
        v: {
            type: GraphQLList(GraphQLFloat),
            resolve(parents, args) {
                let allCoord = Object.values(parents)
                let y = []
                allCoord.map(ch => {
                    y.push(Object.values(ch)[1])
                })
                return y
            }
        }
    }
})



const SubjectType = new GraphQLObjectType({
    name: 'Subject',
    fields: {
        identifier: { type: GraphQLString },
        // geometry:{type:GeometryType},
        // brainImage:{type:GraphQLString},
        // tasks: {type:GraphQLList(GraphQLString) }
    }
})




const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        subject: {
            type: SubjectType,
            args: { identifier: { type: GraphQLString } },
            resolve(parents, args) {
                function getVals(name) {
                    var promise = Record.find({ identifier: name }).exec();
                    return promise
                }

                (async function () {
                    var result = await getVals("PY17N009")
                    return { identifier: result.identifier }

                    // But the best part is, we can just keep awaiting different stuff, without ugly .then()s
                    // var somethingElse = await getSomethingElse()
                    // var moreThings = await getMoreThings()
                })()
            }
        },
        subjects: {
            type: new GraphQLList(SubjectType),
            resolve(parents, args) {
                return subjects;
            }
        }
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery
})