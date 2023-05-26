const Joi = require('joi')


const SchemaCar = Joi.object({
    vehicle_id: Joi.string()
            .required(),

    matricula: Joi.string()
            .replace('-', '')
            .required(),

    vin: Joi.string()
            .required(),
            
    color: Joi.string()
            .required(),
    
    transmision: Joi.string()
            .required(),

    carfax: Joi.string().allow(''),
                           
    kilometros: Joi.string()
            .required(),

    fechaMatriculacion: Joi.string()
            .required(),
            
    precioVenta: Joi.string()
            .replace(',', '.')
            .required(),
            
    procedencia: Joi.string()
            .required(), 

    value: Joi.string()
            .min(0)
 })

 exports.SchemaCar = SchemaCar

    // const {error, value}  = SchemaCar.validate({
    //     vehicle_id: '903010000000088',
    //     matricula: '31-PL-80',
    //     vin: 'VNKKL3D390A347320',
    //     color: 'Cinzento',
    //     transmision: 'Manual',
    //     carfax: 'Japonés/Koreano',
    //     kilometros: '29480',
    //     fechaMatriculacion: '26/12/2019',
    //     precioVenta: '14990,00',
    //     procedencia: 'Corvauto',
    //     value: '915919'
    // })
    // console.log(`esto es la value ${value}, y esto el error  ${error}`)
    // console.log(value)
