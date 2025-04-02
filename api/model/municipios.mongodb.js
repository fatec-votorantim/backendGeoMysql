use('test')
const cidades = // cole aqui o conteudo do json/municipios.json
db.municipios.insertMany(cidades)

use('test')
db.municipios.find().forEach(function(municipio) {
    db.municipios.updateOne(
        { _id: municipio._id },
        {
            $set: {
                local: {
                    type: "Point",
                    coordinates: [municipio.longitude, municipio.latitude]
                }
            },
            $unset: {
                latitude: "",
                longitude: ""
            }
        }
    )  
})

use('test')
db.municipios.createIndex({ local: "2dsphere" })