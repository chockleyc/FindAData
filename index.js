const http = require("http")
const https = require("https")
const fs = require("fs")

console.log("Hello world!")

var maxResults = 10000

const options = {
  host: "www.mcdonalds.com",
  port: 443,
  path: `/googleapps/GoogleRestaurantLocAction.do?method=searchLocation&latitude=35.2263714&longitude=-80.79901849999999&radius=1500.045&maxResults=${maxResults}&country=us&language=en-us&showClosed=&hours24Text=Open%2024%20hr`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}

getJSON = (options, onResult) => {
  console.log("rest::getJSON")

  var port = options.port == 443 ? https : http
  var req = port.request(options, res => {
    var output = '';
    console.log(`${options.host}: ${res.statusCode}`)
    res.setEncoding('utf8')

    res.on('data', chunk => {
      output += chunk;
    })

    res.on('end', () => {
      var obj = JSON.parse(output)
      onResult(res.statusCode, obj)
    })
  })

  req.on('error', e => {
    console.error(`woops, there was a problem: ${e.message}`)
  })

  req.end()
}

var stores = []

getJSON(options, (statusCode, result) => {
  //1: LAT/LONG
  //2: Address
  //3: Full infos
  result.features.map(feature => {
    //console.log(`lat: ${feature.geometry.coordinates[0]} long: ${feature.geometry.coordinates[1]} ` +
    //            `address: ${feature.properties.addressLine1} ${feature.properties.addressLine3} ${feature.properties.subDivision} ${feature.properties.postcode}`)
    stores.push({'lat': feature.geometry.coordinates[0],
                 'long': feature.geometry.coordinates[1], 
                 'address': `${feature.properties.addressLine1} ${feature.properties.addressLine3} ${feature.properties.subDivision} ${feature.properties.postcode}`
    })
  })
  console.log(`found ${stores.length}.  writing to csv....`)
  let csv = flatJSONtoCSV(stores)
  fs.writeFile(`${__dirname}/bin/mcdonalds.csv`, csv, err => {
    if(err) {
      return console.log(err)
    }
    console.log("the file was written")
  })
  //console.log(`onResult: (${statusCode}) ${JSON.stringify(result)}`)
})

flatJSONtoCSV = json => {
  const replacer = (key, value) => value === null ? '' : value //null handling
  const header = Object.keys(json[0])
  let csv = json.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  csv.unshift(header.join(','))
  csv = csv.join('\r\n')

  return csv
}
