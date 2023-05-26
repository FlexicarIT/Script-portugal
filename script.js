const { readFile } = require('fs/promises');
const fetch = require('node-fetch');
const fs = require('fs');
const { SchemaCar } = require('./dto/carDto');


async function mapCsv(filePath, separator = ';') {
  const data = await readFile(filePath);
  const lines = data.toString().split('\n')
  const carObjetc = lines.map(elm => elm.split(separator))
    .map(mapCsvRowToCar)
    .filter(isValidCar)

return carObjetc.map(elm => mapperCar(elm))
}

const mapCsvRowToCar = (coche) => {
  
return {
  vehicle_id: coche[0],
  matricula: coche[1],
  vin: coche[2],
  color: coche[9],
  transmision: coche[10],
  carfax: coche[11],
  kilometros: coche[13],
  fechaMatriculacion: coche[18] ,
  precioVenta: coche[22],
  procedencia: coche[36],
  value: coche[37]
}
}

const mapperCar = (car) => {

  const {value, error} = SchemaCar.validate(car)

  if (error){
    return {
      validCar: false,
      error: `Vehiculo: ${car.vehicle_id} => ${error.details[0].message}`
    }

  }else{
    const carYear = value.fechaMatriculacion.slice(6, 10)
    const carMonth = value.fechaMatriculacion.slice(3, 5)
    let procedencia = value.procedencia
    if (procedencia !== 'Particular') {
      procedencia = 'Empresa'
    }
  
    return {
      validCar: true,
      vehicle_id: value.vehicle_id,
      matricula: value.matricula,
      vin: value.vin,
      color: value.color,
      transmision: value.transmision,
      carfax: value.carfax,
      kilometros: value.kilometros,
      mesMatriculacion: carMonth,
      añoMatriculacion: carYear,
      precioVenta: value.precioVenta,
      procedencia: procedencia,
      value: value.value
    }
  }
  
  
}

const isValidCar = (car) => {
  return car.matricula !== 'Sin matricula' && car.carfax !== 'Sin datos'
}

const especificacionesVehiculo = async (vin, carfax, carYear, carMonth, value) => {
  let response;
  try {
    if(carfax !== "Japonés/Koreano"){
      response = await fetch(`https://data.inventario.pro/car/data?vin=${vin}`, {
        method: 'GET',
        headers: {
          Apikey: 'EpfasfrLX4skyIuXWFYEIu9ZUnzQFLvC_q7gLhMaiEIsUA'
        }
      })

    }else{
      response = await fetch(`https://data.inventario.pro/car/data?natCode=${value}&year=${carYear}&month=${carMonth}`, {
        method: 'GET',
        headers: {
          Apikey: 'EpfasfrLX4skyIuXWFYEIu9ZUnzQFLvC_q7gLhMaiEIsUA'
        }
      })
    }

    if(response.status === 404){
      const datos = await response.json()
      return {
        valid: false,
        error: `Especificaciones -> ${datos.errors}`
      }
    }


    const datos = await response.json()
    const { brand_local, model_local, version_name_local, body_type, fuel_type, max_power_hp, cc, number_of_doors, seating_capacity, retail_price, consumption_combi, consumption_urban, consumption_road, emissions, vehicle_id } = datos.data
   
    const emissionsChecked = emissions ?? 0

    return {
      valid: true,
      brand_local,
      model_local,
      version_name_local,
      body_type,
      fuel_type,
      max_power_hp,
      cc,
      number_of_doors,
      seating_capacity,
      // year,
      // month,
      retail_price,
      consumption_combi,
      consumption_road,
      consumption_urban,
      emissionsChecked,
      vehicle_id
    }
  }

  catch (e) {
    console.error('entro en el catch', e)
  }
}


const equipamientoVehiculo = async (vin,carfax, carYear, carMonth, value) => {
  let response;
  if(carfax !== "Japonés/Koreano"){
    response = await fetch(`https://data.inventario.pro/car/specs?vin=${vin}`, {
      method: 'GET',
      headers: {
        Apikey: 'EpfasfrLX4skyIuXWFYEIu9ZUnzQFLvC_q7gLhMaiEIsUA'
      }
    })

  }else{
    response = await fetch(`https://data.inventario.pro/car/specs?natCode=${value}&year=${carYear}&month=${carMonth}`, {
      method: 'GET',
      headers: {
        Apikey: 'EpfasfrLX4skyIuXWFYEIu9ZUnzQFLvC_q7gLhMaiEIsUA'
      }
    })
  }

if(response.status === 500){
  return {
    valid: false,
    error: `inventario pro no nos proporciona equipamiento para este vehículo`
  }
}
if(response.status === 404){
  const datos = await response.json()
  return {
    valid: false,
    error: `Equipamiento ->${datos.errors}`
  }
}

  const datos = await response.json()
  const { standard } = datos.data

  const seguridad = []
  const exterior = []
  let multimedia = []
  let confort = []
  let interior = []

  standard.forEach(elm => {
    if (elm.category === 'Segurança Passiva' || elm.category === 'Segurança Activa' || elm.category === 'Segurança') {
      elm.items.forEach(e => seguridad.push(e))
    }
    if (elm.category === 'Tuning/Componentes opticos' || elm.category === 'Rodas') {
      elm.items.forEach(e => exterior.push(e))
    }
    if (elm.category === 'Audio/Comunicações/Instrumentos') {
      multimedia = elm.items
    }
    if (elm.category === "Outros") {
      confort = elm.items
    }
    if (elm.category === 'Conforto/Interior & Exterior') {
      interior = elm.items
    }
  })
  return {
    valid: true,
    seguridad,
    exterior,
    multimedia,
    confort,
    interior
  }

}
// equipamientoVehiculo()

const getSql = (coche, especificaciones, equipamiento) => {
  const sqls = []

  if(especificaciones.valid){
    sqls.push(`INSERT INTO vehicle_data (vehicle_id, concesionario, sede, marca, modelo, version, matricula, bastidor, precio, precio_vn, precio_as24, km, potencia, cilindrada, puertas, plazas, year, month, combustible, emisiones, consumo_carretera, consumo_urbano, consumo_mixto, cambio, color, carroceria, procedencia, ubicacion, sede_publicacion, jato_id) VALUES (${coche.vehicle_id},'Porto', 'Flexicar Porto', '${especificaciones.brand_local}', '${especificaciones.model_local}', '${especificaciones.version_name_local}', '${coche.matricula}', '${coche.vin}', ${coche.precioVenta}, ${especificaciones.retail_price}, ${coche.precioVenta}, ${coche.kilometros}, ${especificaciones.max_power_hp}, ${especificaciones.cc}, ${especificaciones.number_of_doors}, ${especificaciones.seating_capacity}, ${coche.añoMatriculacion}, ${coche.mesMatriculacion}, '${especificaciones.fuel_type}', ${especificaciones.emissionsChecked}, ${especificaciones.consumption_road}, ${especificaciones.consumption_urban}, ${especificaciones.consumption_combi}, '${coche.transmision}', '${coche.color}', '${especificaciones.body_type}', '${coche.procedencia}','Flexicar Porto', 'Flexicar Porto', ${especificaciones.vehicle_id});`)
  }else{
    sqls.push(`El vehículo ${coche.vehicle_id} => ${especificaciones.error}`)
  }


  //equipamiento
  if(equipamiento.valid){

    equipamiento.seguridad.forEach(e => sqls.push(`INSERT INTO vehicle_seguridad (vehicle_id, elemento) VALUES ( ${coche.vehicle_id}, '${e}');`))
  
    equipamiento.exterior.forEach(e => sqls.push(`INSERT INTO vehicle_exterior (vehicle_id, elemento) VALUES ( ${coche.vehicle_id}, '${e}');`))
  
    equipamiento.multimedia.forEach(e => sqls.push(`INSERT INTO vehicle_multimedia (vehicle_id, elemento) VALUES ( ${coche.vehicle_id}, '${e}');`))
  
    equipamiento.confort.forEach(e => sqls.push(`INSERT INTO vehicle_confort (vehicle_id, elemento) VALUES ( ${coche.vehicle_id}, '${e}');`))
  
    equipamiento.interior.forEach(e => sqls.push(`INSERT INTO vehicle_interior (vehicle_id, elemento) VALUES ( ${coche.vehicle_id}, '${e}');`))
  }else{
    sqls.push(`El vehículo ${coche.vehicle_id} => ${equipamiento.error}`)
  }

  return sqls
}


const main = async () => {
  try {
    const coches = await mapCsv('stockPortugal.csv')
    
    for (const coche of coches) {

      if(coche.validCar){

        const [especificaciones, equipamiento] = await Promise.all([
          especificacionesVehiculo(
            coche.vin,
            coche.carfax,
            coche.añoMatriculacion,
            coche.mesMatriculacion,
            coche.value
          ),
          equipamientoVehiculo(
            coche.vin,
            coche.carfax,
            coche.añoMatriculacion,
            coche.mesMatriculacion,
            coche.value
          ),
        ]);
        const sql = getSql(coche, especificaciones, equipamiento);
        
        let textToAppend = [
          `Vehiculo: ${coche.vehicle_id}`,
          JSON.stringify(especificaciones, null, 4),
          JSON.stringify(equipamiento, null, 4),
        
          '\n'
        ].join('\n')
        
        for (const query of sql) {
          textToAppend += `${query}\n`
        }
        textToAppend += "\n"

       fs.appendFile('output.txt', textToAppend, (err) => {
         if (err) {
           console.error(err)
         } else {
           console.log('File written successfully');
         }
       })

      }else{

        let textToAppend = [`${coche.error}`, "\n"].join("\n")

        fs.appendFile('output.txt', textToAppend, (err) => {
          if (err) {
            console.error(err)
          } else {
            console.log('File written successfully');
          }
        }) 

      }
    }
  }
  catch (error) {
    console.error(error)
  }
}
main()

// const vin = 'WBAHT510005F30770'
// const vehicle_id = 903010000000015

// async function prueba(vin, vehicle_id) {
//   try {
//     const pruebaCoche = await mapCsv('stockPortugal.csv')
//     // const pruebaEquipamiento = await equipamientoVehiculo(vin, vehicle_id)
//     // const pruebaEspecificaciones = await especificacionesVehiculo(vin, vehicle_id)
//     console.log(pruebaCoche, 'numero de coches--->', pruebaCoche.length)
//     // console.log(pruebaEspecificaciones)
//     // console.log(pruebaEquipamiento)
//   }
//   catch (error) {
//     console.error(JSON.stringify(error.stack))
//   }
// }
// prueba(vin, vehicle_id)